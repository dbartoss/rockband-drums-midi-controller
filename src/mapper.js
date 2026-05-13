/**
 * Input Mapper
 * Converts HID button data to MIDI note numbers
 */

const config = require('./config');

/**
 * Map a pad name to MIDI note
 * @param {string} padName - 'red', 'yellow', 'blue', 'green', 'kick', 'cymbal'
 * @returns {number} MIDI note number
 * @throws {Error} if pad name is invalid
 */
function mapPadToNote(padName) {
  const drumMapping = config.loadDrumMapping();
  
  if (!drumMapping.pads[padName]) {
    throw new Error(`Unknown pad: ${padName}`);
  }

  return drumMapping.pads[padName].midiNote;
}

/**
 * Get velocity for a pad press
 * @param {number} pressure - 0-255 pressure value (if available)
 * @returns {number} MIDI velocity (10-127)
 */
function getVelocity(pressure = null) {
  const appConfig = config.getConfig();
  
  if (appConfig.usePressureVelocity && pressure !== null && pressure !== undefined) {
    // Map pressure (0-255) to velocity (10-127)
    const velocity = Math.floor((pressure / 255) * 117) + 10;
    return Math.min(127, Math.max(10, velocity));
  }

  return appConfig.defaultVelocity;
}

/**
 * Map raw HID data to pad press
 * NOTE: HID byte format will be discovered in Phase 2.1
 * 
 * @param {Buffer} data - Raw HID data
 * @returns {Object} { padName, velocity } or null if no press
 */
function mapHidDataToPad(data) {
  // TODO: Implement after discovering HID format
  // For now, return null to indicate discovery phase
  return null;
}

module.exports = {
  mapPadToNote,
  getVelocity,
  mapHidDataToPad
};
