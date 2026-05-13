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

    pollInterval = setInterval(() => {
      try {
        // Read HID data
        const data = hidDevice.readSync();
        
        if (appConfig.logHidData) {
          console.log('Raw HID data:', data.toString('hex'));
        }

        // Map to pad press
        const padPress = mapper.mapHidDataToPad(data);

        // TODO: Implement state tracking and MIDI sending
        // For now, this is a placeholder
        
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
