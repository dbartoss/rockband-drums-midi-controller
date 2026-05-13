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
 * HID byte mapping discovered from hardware testing:
 * byte[0] values map to pads/pedals (corrected for actual button positions):
 * - [0]:1 = Yellow pad (Hi-Hat)
 * - [0]:2 = Blue pad (Tom-Tom)
 * - [0]:4 = Red pad (Snare Drum)
 * - [0]:8 = Green pad (Crash Cymbal)
 * - [0]:16 = Kick pedal (Bass Drum)
 *
 * Ignored:
 * - byte[2] = 8 (Blue X face button, stuck/always on)
 * - bytes[3-6] = 128 (pressure/axis data)
 * - bytes[20-26] = 2 (baseline states)
 *
 * @param {Buffer} data - Raw HID data
 * @returns {Object} { padName, velocity } or null if no press
 */
function mapHidDataToPad(data) {
  if (!data || data.length === 0) return null;

  const byte0 = data[0];

  switch (byte0) {
    case 1:
      return { padName: 'blue', velocity: byte0 };    // Blue pad = Tom-Tom
    case 2:
      return { padName: 'green', velocity: byte0 };   // Green pad = Crash Cymbal
    case 4:
      return { padName: 'red', velocity: byte0 };     // Red pad = Snare Drum
    case 8:
      return { padName: 'yellow', velocity: byte0 };  // Yellow pad = Hi-Hat
    case 16:
      return { padName: 'kick', velocity: byte0 };    // Kick pedal = Bass Drum
    default:
      return null;
  }
}

module.exports = {
  mapPadToNote,
  getVelocity,
  mapHidDataToPad
};
