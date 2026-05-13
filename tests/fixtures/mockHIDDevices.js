/**
 * Mock HID Device Fixtures
 * Simulated Harmonix PS3 drum HID device for testing
 */

/**
 * Mock devices list for node-hid
 */
const mockDevices = [
  {
    vendorId: 0x12ba,
    productId: 0x0210,
    path: '/dev/hidraw0',
    manufacturer: 'Sony Computer Entertainment America',
    product: 'Harmonix Drum Kit for PlayStation(R)3',
    serialNumber: 'ABC123',
    releaseNumber: 0x1000,
    interface: 0,
    usagePage: 0xff00,
    usage: 0x0001
  }
];

/**
 * Mock HID read data
 * These will be populated after Phase 2.1 discovery
 */
const mockHIDData = {
  // Placeholder - actual byte sequences to be discovered
  redPadPress: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  yellowPadPress: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  bluePadPress: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  greenPadPress: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  kickPedalPress: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  cymbalPress: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  noPress: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
};

module.exports = {
  mockDevices,
  mockHIDData
};
