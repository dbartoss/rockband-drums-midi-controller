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
  const appConfig = config.getConfig();

  if (!drumMapping.pads[padName]) {
    throw new Error(`Unknown pad: ${padName}`);
  }

  const mode = appConfig.drumMappingMode || 'realistic';
  const modeMapping = drumMapping.modes[mode];

  if (!modeMapping) {
    throw new Error(`Unknown mapping mode: ${mode}`);
  }

  // If mode has explicit mapping for this pad, use it; otherwise use pad's default
  if (modeMapping[padName] !== undefined) {
    return modeMapping[padName];
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

// byte[0] bitmask layout discovered from hardware testing:
// bit 1  = Blue pad   (Tom-Tom)
// bit 2  = Green pad  (Crash Cymbal)
// bit 4  = Red pad    (Snare Drum)
// bit 8  = Yellow pad (Hi-Hat)
// bit 16 = Kick pedal (Bass Drum)
//
// Ignored: byte[2]=8 (stuck Blue X button), bytes[3-6]=128 (axis data),
//          bytes[20-26]=2 (baseline states)
const PAD_BITS = [
  { bit: 1,  padName: 'blue' },
  { bit: 2,  padName: 'green' },
  { bit: 4,  padName: 'red' },
  { bit: 8,  padName: 'yellow' },
  { bit: 16, padName: 'kick' },
];

/**
 * Map raw HID data to all currently pressed pads.
 * byte[0] is a bitmask — multiple bits may be set simultaneously.
 *
 * @param {Buffer} data - Raw HID data
 * @returns {Array<{ padName: string, velocity: number }>} — empty when nothing pressed
 */
function mapHidDataToPad(data) {
  if (!data || data.length === 0) return [];

  const byte0 = data[0];
  if (byte0 === 0) return [];

  return PAD_BITS
    .filter(({ bit }) => byte0 & bit)
    .map(({ bit, padName }) => ({ padName, velocity: bit }));
}

/**
 * Switch drum mapping mode
 * @param {string} mode - 'game-based' or 'realistic'
 * @throws {Error} if mode is invalid
 */
function setMappingMode(mode) {
  const drumMapping = config.loadDrumMapping();

  if (!drumMapping.modes[mode]) {
    throw new Error(`Unknown mapping mode: ${mode}. Valid modes: ${Object.keys(drumMapping.modes).join(', ')}`);
  }

  process.env.DRUM_MAPPING_MODE = mode;
}

/**
 * Get current drum mapping mode
 * @returns {string} current mode ('game-based' or 'realistic')
 */
function getMappingMode() {
  const appConfig = config.getConfig();
  return appConfig.drumMappingMode || 'realistic';
}

/**
 * Get available mapping modes
 * @returns {Array<string>} list of available modes
 */
function getAvailableModes() {
  const drumMapping = config.loadDrumMapping();
  return Object.keys(drumMapping.modes);
}

module.exports = {
  mapPadToNote,
  getVelocity,
  mapHidDataToPad,
  setMappingMode,
  getMappingMode,
  getAvailableModes
};
