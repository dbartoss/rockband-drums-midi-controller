/**
 * MIDI Output
 * Sends MIDI messages to DAW via virtual MIDI port
 */

const easymidi = require('easymidi');
const config = require('./config');

let output = null;

/**
 * Initialize MIDI output port
 * @returns {Object} easymidi output instance
 * @throws {Error} if port not available
 */
function initMidiOutput() {
  const portName = config.getConfig().midiPort;
  
  try {
    output = new easymidi.Output(portName);
    console.log(`✅ MIDI output initialized: "${portName}"`);
    return output;
  } catch (error) {
    throw new Error(`Failed to initialize MIDI output "${portName}": ${error.message}`);
  }
}

/**
 * Send MIDI note-on message
 * @param {number} note - MIDI note number (0-127)
 * @param {number} velocity - Note velocity (0-127)
 * @param {number} channel - MIDI channel (1-16, default 10 for drums)
 */
function sendNoteOn(note, velocity = 100, channel = 10) {
  if (!output) {
    throw new Error('MIDI output not initialized');
  }

  output.send('noteon', {
    note,
    velocity: Math.floor(velocity),
    channel
  });
}

/**
 * Send MIDI note-off message
 * @param {number} note - MIDI note number (0-127)
 * @param {number} velocity - Note velocity (0-127, typically 0)
 * @param {number} channel - MIDI channel (1-16, default 10 for drums)
 */
function sendNoteOff(note, velocity = 0, channel = 10) {
  if (!output) {
    throw new Error('MIDI output not initialized');
  }

  output.send('noteoff', {
    note,
    velocity: Math.floor(velocity),
    channel
  });
}

/**
 * Close MIDI output port
 */
function closeMidiOutput() {
  if (output) {
    output.close();
    output = null;
    console.log('✅ MIDI output closed');
  }
}

module.exports = {
  initMidiOutput,
  sendNoteOn,
  sendNoteOff,
  closeMidiOutput
};
