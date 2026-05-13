/**
 * Configuration loader
 * Handles .env and config file parsing
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

function loadDeviceIds() {
  const configPath = path.join(__dirname, '../config/deviceIds.json');
  const data = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(data);
}

function loadDrumMapping() {
  const configPath = path.join(__dirname, '../config/drumMapping.json');
  const data = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(data);
}

function getConfig() {
  return {
    midiPort: process.env.MIDI_PORT_NAME || 'Rock Band Drums',
    vendorId: process.env.DEVICE_VENDOR_ID ? parseInt(process.env.DEVICE_VENDOR_ID, 16) : 0x12ba,
    productId: process.env.DEVICE_PRODUCT_ID ? parseInt(process.env.DEVICE_PRODUCT_ID, 16) : 0x0210,
    pollRateHz: parseInt(process.env.POLL_RATE_HZ) || 60,
    debounceMs: parseInt(process.env.DEBOUNCE_MS) || 50,
    usePressureVelocity: process.env.USE_PRESSURE_VELOCITY === 'true',
    defaultVelocity: parseInt(process.env.DEFAULT_VELOCITY) || 100,
    debug: process.env.DEBUG === 'true',
    logHidData: process.env.LOG_HID_DATA === 'true'
  };
}

module.exports = {
  loadDeviceIds,
  loadDrumMapping,
  getConfig
};
