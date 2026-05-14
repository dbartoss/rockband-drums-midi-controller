/**
 * Controller Loop
 * Main polling loop that reads HID input and sends MIDI output
 */

const config = require('./config');
const detect = require('./detect');
const midiOutput = require('./midiOutput');
const mapper = require('./mapper');
const logger = require('./logger');
const latencyMonitor = require('./latencyMonitor');

let isRunning = false;
let pollInterval = null;
let hidDevice = null;

// Track previous HID state for deduplication
let previousHidState = null;

// Latency monitoring
let latencyAggregator = null;

/**
 * Extract non-zero bytes from HID data
 */
const extractNonZeroBytes = (data) => {
  const nonZeroBytes = [];
  for (let i = 0; i < Math.min(data.length, 27); i++) {
    if (data[i] > 0) {
      nonZeroBytes.push(`[${i}]=${data[i]}`);
    }
  }
  return nonZeroBytes;
};

/**
 * Start the controller
 * @param {Object} device - Device info from detect.findDrumKit()
 */
async function start(device) {
    if (isRunning) {
        throw new Error('Controller already running');
    }

    const appConfig = config.getConfig();
    const pollRateMs = 1000 / appConfig.pollRateHz;

    try {
        // Connect to HID device
        hidDevice = detect.openDevice(device);

        // Initialize MIDI output
        midiOutput.initMidiOutput();

        // Initialize loggers with appConfig
        const logRawHid = logger.rawHidLogger(appConfig);
        const logPadDetection = logger.padDetectionLogger(appConfig);
        const logMidiPress = logger.midiPressLogger(appConfig);
        const logMidiRelease = logger.midiReleaseLogger(appConfig);

        // Initialize latency monitoring
        latencyAggregator = latencyMonitor.createLatencyAggregator();
        const hidReadTime = latencyAggregator.getTracker('HID Read', 5);
        const mapTime = latencyAggregator.getTracker('Mapping', 2);
        const midiSendTime = latencyAggregator.getTracker('MIDI Send', 5);
        const pollCycleTime = latencyAggregator.getTracker('Poll Cycle', 0);

        // Start polling loop
        isRunning = true;
        let previousState = {};
        let lastPressTime = {};

        logger.diagnosticModeLogger(appConfig)('🔍 DIAGNOSTIC MODE ENABLED - Not sending MIDI, only logging pad detections');

        pollInterval = setInterval(() => {
            const cycleStart = pollCycleTime.start();

            try {
                // Read HID data
                const hidReadStart = hidReadTime.start();
                const data = hidDevice.readSync();
                const now = Date.now();
                hidReadTime.end(hidReadStart, { padName: 'HID Read' });

                // Only log HID if data changed (deduplication)
                const currentHidState = data.toString('hex');
                if (currentHidState !== previousHidState) {
                    previousHidState = currentHidState;
                    const bytes = Array.from(data).map((v, i) => `[${i}]:${v}`);
                    const nonZeroBytes = bytes.filter(b => !b.endsWith(':0')).join(' ');
                    logRawHid(currentHidState, nonZeroBytes);
                }

                // Map to pad press
                const mapStart = mapTime.start();
                const padPress = mapper.mapHidDataToPad(data);
                mapTime.end(mapStart, { padName: padPress?.padName || 'none' });

                // State tracking and MIDI sending
                if (padPress) {
                    const { padName, velocity: rawVelocity } = padPress;

                    // Log detected pad press (throttled via logger)
                    const nonZeroBytes = extractNonZeroBytes(data);
                    logPadDetection(now, padName, rawVelocity, nonZeroBytes);

                    // Check if this is a new press (state change) or debounce window
                    if (!previousState[padName]) {
                        // Button just pressed (state change from unpressed to pressed)
                        if (!lastPressTime[padName] || now - lastPressTime[padName] >= appConfig.debounceMs) {
                            if (!appConfig.diagnosticMode) {
                                try {
                                    const midiNote = mapper.mapPadToNote(padName);
                                    const velocity = mapper.getVelocity(rawVelocity);

                                    const midiStart = midiSendTime.start();
                                    midiOutput.sendNoteOn(midiNote, velocity);
                                    midiSendTime.end(midiStart, { padName, action: 'note-on' });

                                    logMidiPress(padName, midiNote, velocity);
                                } catch (error) {
                                    logger.errorLogger(`Error sending MIDI for ${padName}`, error);
                                }
                            }

                            previousState[padName] = true;
                            lastPressTime[padName] = now;
                        }
                    }
                } else {
                    // No button currently pressed - send note-off for any previously pressed buttons
                    for (const padName in previousState) {
                        if (previousState[padName]) {
                            if (!appConfig.diagnosticMode) {
                                try {
                                    const midiNote = mapper.mapPadToNote(padName);

                                    const midiStart = midiSendTime.start();
                                    midiOutput.sendNoteOff(midiNote);
                                    midiSendTime.end(midiStart, { padName, action: 'note-off' });

                                    logMidiRelease(padName, midiNote);
                                } catch (error) {
                                    logger.errorLogger(`Error sending note-off for ${padName}`, error);
                                }
                            }

                            previousState[padName] = false;
                        }
                    }
                }

                pollCycleTime.end(cycleStart, { padName: padPress?.padName || 'none' });

            } catch (error) {
                logger.errorLogger('Error in polling loop', error);
            }
        }, pollRateMs);

        logger.pollingStartLogger(appConfig.pollRateHz, pollRateMs);

    } catch (error) {
        isRunning = false;
        throw error;
    }
}

/**
 * Stop the controller
 */
function stop() {
    if (!isRunning) {
        return;
    }

    isRunning = false;

    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }

    if (hidDevice) {
        try {
            hidDevice.close();
        } catch (error) {
            logger.errorLogger('Error closing HID device', error);
        }
        hidDevice = null;
    }

    midiOutput.closeMidiOutput();
    logger.controllerStopLogger();
}

/**
 * Report latency statistics
 */
function reportLatency() {
    if (!latencyAggregator) {
        console.log('Latency monitoring not initialized. Start the controller first.');
        return;
    }
    latencyAggregator.reportAll();
}

/**
 * Reset latency statistics
 */
function resetLatency() {
    if (latencyAggregator) {
        latencyAggregator.resetAll();
    }
}

module.exports = {
    start,
    stop,
    reportLatency,
    resetLatency
};
