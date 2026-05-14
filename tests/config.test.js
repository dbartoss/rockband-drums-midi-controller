/**
 * Config Tests
 * Unit tests for configuration loading and parsing
 */

const config = require('../src/config');

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete require.cache[require.resolve('../src/config')];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

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
      expect(appConfig).toHaveProperty('debug');
      expect(appConfig).toHaveProperty('logHidData');
    });

    test('should have default values when env vars not set', () => {
      delete process.env.MIDI_PORT_NAME;
      delete process.env.DEVICE_VENDOR_ID;
      delete process.env.DEVICE_PRODUCT_ID;
      delete process.env.POLL_RATE_HZ;
      delete process.env.DEBOUNCE_MS;
      delete process.env.DEBUG;
      delete process.env.LOG_HID_DATA;
      delete process.env.DIAGNOSTIC_MODE;

      const appConfig = config.getConfig();
      expect(appConfig.midiPort).toBe('Rock Band Drums');
      expect(appConfig.vendorId).toBe(0x12ba);
      expect(appConfig.productId).toBe(0x0210);
      expect(appConfig.pollRateHz).toBe(60);
      expect(appConfig.debounceMs).toBe(50);
      expect(appConfig.debug).toBe(false);
      expect(appConfig.logHidData).toBe(false);
      expect(appConfig.diagnosticMode).toBe(false);
    });

    test('should read DEBUG from environment', () => {
      process.env.DEBUG = 'true';
      const appConfig = config.getConfig();
      expect(appConfig.debug).toBe(true);
    });

    test('should read LOG_HID_DATA from environment', () => {
      process.env.LOG_HID_DATA = 'true';
      const appConfig = config.getConfig();
      expect(appConfig.logHidData).toBe(true);
    });

    test('should read DIAGNOSTIC_MODE from environment', () => {
      process.env.DIAGNOSTIC_MODE = 'true';
      const appConfig = config.getConfig();
      expect(appConfig.diagnosticMode).toBe(true);
    });

    test('should read MIDI_PORT_NAME from environment', () => {
      process.env.MIDI_PORT_NAME = 'Custom MIDI Port';
      const appConfig = config.getConfig();
      expect(appConfig.midiPort).toBe('Custom MIDI Port');
    });

    test('should parse DEVICE_VENDOR_ID as hex', () => {
      process.env.DEVICE_VENDOR_ID = '0x1234';
      const appConfig = config.getConfig();
      expect(appConfig.vendorId).toBe(0x1234);
    });

    test('should parse DEVICE_PRODUCT_ID as hex', () => {
      process.env.DEVICE_PRODUCT_ID = '0x5678';
      const appConfig = config.getConfig();
      expect(appConfig.productId).toBe(0x5678);
    });

    test('should parse POLL_RATE_HZ as integer', () => {
      process.env.POLL_RATE_HZ = '120';
      const appConfig = config.getConfig();
      expect(appConfig.pollRateHz).toBe(120);
    });

    test('should parse DEBOUNCE_MS as integer', () => {
      process.env.DEBOUNCE_MS = '100';
      const appConfig = config.getConfig();
      expect(appConfig.debounceMs).toBe(100);
    });

    test('should respect USE_PRESSURE_VELOCITY from environment', () => {
      process.env.USE_PRESSURE_VELOCITY = 'true';
      const appConfig = config.getConfig();
      expect(appConfig.usePressureVelocity).toBe(true);
    });

    test('should parse DEFAULT_VELOCITY as integer', () => {
      process.env.DEFAULT_VELOCITY = '80';
      const appConfig = config.getConfig();
      expect(appConfig.defaultVelocity).toBe(80);
    });

    test('should treat non-"true" values as false for boolean env vars', () => {
      process.env.DEBUG = 'false';
      process.env.LOG_HID_DATA = '0';
      process.env.DIAGNOSTIC_MODE = '';
      const appConfig = config.getConfig();
      expect(appConfig.debug).toBe(false);
      expect(appConfig.logHidData).toBe(false);
      expect(appConfig.diagnosticMode).toBe(false);
    });
  });
});
