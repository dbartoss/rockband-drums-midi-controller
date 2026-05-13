/**
 * Device Detection
 * Scans for Harmonix Drum Kit and establishes HID connection
 */

const HID = require('node-hid');
const config = require('./config');

/**
 * Find Harmonix Drum Kit PS3
 * @returns {Object|null} Device info or null if not found
 */
function findDrumKit() {
  const devices = HID.devices();
  const deviceConfig = config.loadDeviceIds();
  
  if (config.getConfig().debug) {
    console.log('Available HID devices:', devices.length);
  }

  for (const supportedDevice of deviceConfig.devices) {
    const found = devices.find(
      d => d.vendorId === supportedDevice.vendorId &&
           d.productId === supportedDevice.productId
    );

    if (found) {
      return {
        name: supportedDevice.name,
        vendorId: supportedDevice.vendorId,
        productId: supportedDevice.productId,
        path: found.path,
        manufacturer: found.manufacturer,
        product: found.product
      };
    }
  }

  return null;
}

/**
 * Open HID device connection
 * @param {Object} device Device info from findDrumKit()
 * @returns {HID} HID device instance
 */
function openDevice(device) {
  try {
    const hid = new HID.HID(device.path);
    console.log('✅ HID connection established');
    return hid;
  } catch (error) {
    throw new Error(`Failed to open HID device: ${error.message}`);
  }
}

module.exports = {
  findDrumKit,
  openDevice
};
