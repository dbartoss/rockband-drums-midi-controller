/**
 * Config Tests
 * Unit tests for configuration loading and parsing
 */

const config = require('../src/config');

describe('Config', () => {
  describe('loadDeviceIds', () => {
    test('should load device configuration from JSON', () => {
      const deviceConfig = config.loadDeviceIds();
      expect(deviceConfig).toHaveProperty('devices');
      expect(Array.isArray(deviceConfig.devices)).toBe(true);
    });

    test('should have Harmonix PS3 in supported devices', () => {
      const deviceConfig = config.loadDeviceIds();
      const harmonix = deviceConfig.devices.find(
        d => d.vendorId === 0x12ba && d.productId === 0x0210
      );
      expect(harmonix).toBeDefined();
      expect(harmonix.name).toContain('Harmonix');
    });
  });

  describe('loadDrumMapping', () => {
    test('should load drum mapping from JSON', () => {
      const mapping = config.loadDrumMapping();
      expect(mapping).toHaveProperty('pads');
    });

    test('should have all 6 drum pads mapped', () => {
      const mapping = config.loadDrumMapping();
      expect(mapping.pads).toHaveProperty('red');
      expect(mapping.pads).toHaveProperty('yellow');
      expect(mapping.pads).toHaveProperty('blue');
      expect(mapping.pads).toHaveProperty('green');
      expect(mapping.pads).toHaveProperty('kick');
      expect(mapping.pads).toHaveProperty('cymbal');
    });

    test('each pad should have midiNote property', () => {
      const mapping = config.loadDrumMapping();
      Object.values(mapping.pads).forEach(pad => {
        expect(pad).toHaveProperty('midiNote');
        expect(typeof pad.midiNote).toBe('number');
        expect(pad.midiNote).toBeGreaterThanOrEqual(0);
        expect(pad.midiNote).toBeLessThanOrEqual(127);
      });
    });
  });

  describe('getConfig', () => {
    test('should return configuration object', () => {
      const appConfig = config.getConfig();
      expect(appConfig).toBeDefined();
    });

    test('should have required properties', () => {
      const appConfig = config.getConfig();
      expect(appConfig).toHaveProperty('midiPort');
      expect(appConfig).toHaveProperty('vendorId');
      expect(appConfig).toHaveProperty('productId');
      expect(appConfig).toHaveProperty('pollRateHz');
      expect(appConfig).toHaveProperty('debounceMs');
      expect(appConfig).toHaveProperty('diagnosticMode');
    });

    test('should have default values', () => {
      const appConfig = config.getConfig();
      expect(appConfig.midiPort).toBe('IAC Driver Bus 1');
      expect(appConfig.vendorId).toBe(0x12ba);
      expect(appConfig.productId).toBe(0x0210);
      expect(appConfig.pollRateHz).toBe(60);
      expect(appConfig.debounceMs).toBe(50);
    });
  });
});
