/**
 * Controller Loop
 * Main polling loop that reads HID input and sends MIDI output
 */

const config = require('./config');
const detect = require('./detect');
const midiOutput = require('./midiOutput');
const mapper = require('./mapper');

let isRunning = false;
let pollInterval = null;
let hidDevice = null;

// Throttle cache for different log types
const throttle = {
  lastHidLogTime: 0,
  lastDetectionLogTime: 0,
};

// Track previous HID state for deduplication
let previousHidState = null;

/**
 * Check if enough time has passed to log (throttling)
 * @param {string} logType - Type of log ('hid' or 'detection')
 * @param {number} intervalMs - Minimum milliseconds between logs
 * @param {number} now - Current timestamp
 * @returns {boolean} True if should log, false if throttled
 */
function shouldLog(logType, intervalMs, now) {
  const key = `last${logType.charAt(0).toUpperCase() + logType.slice(1)}LogTime`;
  if (!throttle[key]) {
    throttle[key] = 0;
  }
  if (now - throttle[key] >= intervalMs) {
    throttle[key] = now;
    return true;
  }
  return false;
}

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

        // Start polling loop
        isRunning = true;
        let previousState = {};
        let lastPressTime = {};

        if (appConfig.diagnosticMode) {
            console.log('🔍 DIAGNOSTIC MODE ENABLED - Not sending MIDI, only logging pad detections');
        }

        pollInterval = setInterval(() => {
            try {
                // Read HID data
                const data = hidDevice.readSync();
                const now = Date.now();

                // Only log HID if data changed (deduplication)
                const currentHidState = data.toString('hex');
                if (currentHidState !== previousHidState && appConfig.logHidData) {
                    previousHidState = currentHidState;
                    const bytes = Array.from(data).map((v, i) => `[${i}]:${v}`);
                    const nonZeroBytes = bytes.filter(b => !b.endsWith(':0')).join(' ');
                    console.log(`📦 Raw HID: ${currentHidState}`);
                    if (nonZeroBytes) console.log(`   Non-zero: ${nonZeroBytes}`);
                }

                // Map to pad press
                const padPress = mapper.mapHidDataToPad(data);


                // State tracking and MIDI sending
                if (padPress) {
                    const { padName, velocity: rawVelocity } = padPress;

                    // Log detected pad press (throttled to 200ms)
                    if (shouldLog('detection', 500, now)) {
                        console.log(`📍 Pad detected: ${padName} (raw velocity: ${rawVelocity})`);

                        // Also show which bytes are non-zero
                        const nonZeroBytes = [];
                        for (let i = 0; i < Math.min(data.length, 27); i++) {
                            if (data[i] > 0) {
                                nonZeroBytes.push(`[${i}]=${data[i]}`);
                            }
                        }
                        if (nonZeroBytes.length > 0) {
                            console.log(`    Non-zero bytes: ${nonZeroBytes.join(', ')}`);
                        }
                    }

                    // Check if this is a new press (state change) or debounce window
                    if (!previousState[padName]) {
                        // Button just pressed (state change from unpressed to pressed)
                        if (!lastPressTime[padName] || now - lastPressTime[padName] >= appConfig.debounceMs) {
                            if (!appConfig.diagnosticMode) {
                                try {
                                    const midiNote = mapper.mapPadToNote(padName);
                                    const velocity = mapper.getVelocity(rawVelocity);

                                    midiOutput.sendNoteOn(midiNote, velocity);

                                    if (appConfig.debug) {
                                        console.log(`🥁 ${padName} pressed → MIDI note ${midiNote} (velocity ${velocity})`);
                                    }
                                } catch (error) {
                                    console.error(`Error sending MIDI for ${padName}:`, error.message);
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
                                    midiOutput.sendNoteOff(midiNote);

                                    if (appConfig.debug) {
                                        console.log(`🥁 ${padName} released → MIDI note-off ${midiNote}`);
                                    }
                                } catch (error) {
                                    console.error(`Error sending note-off for ${padName}:`, error.message);
                                }
                            }

                            previousState[padName] = false;
                        }
                    }
                }

            } catch (error) {
                console.error('Error in polling loop:', error.message);
            }
        }, pollRateMs);

        console.log(`📊 Polling at ${appConfig.pollRateHz}Hz (${pollRateMs}ms interval)`);

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
            console.error('Error closing HID device:', error.message);
        }
        hidDevice = null;
    }

    midiOutput.closeMidiOutput();
    console.log('Controller stopped');
}

module.exports = {
    start,
    stop
};
