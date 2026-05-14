/**
 * Controller Logging Tests
 * Verifies that console.log calls respect appConfig settings
 */

jest.mock('../src/detect');
jest.mock('../src/midiOutput');
jest.mock('../src/mapper');

describe('Controller Logging', () => {
  let consoleSpy;
  let consoleErrorSpy;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
  });

  describe('diagnosticMode logging', () => {
    test('should log diagnostic message when DIAGNOSTIC_MODE=true', async () => {
      process.env.DIAGNOSTIC_MODE = 'true';
      const config = require('../src/config');
      const detect = require('../src/detect');
      const midiOutput = require('../src/midiOutput');
      const mapper = require('../src/mapper');
      const controller = require('../src/controller');

      const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
      detect.openDevice.mockReturnValue(mockDevice);
      midiOutput.initMidiOutput.mockImplementation(() => {});
      midiOutput.closeMidiOutput.mockImplementation(() => {});
      mapper.mapHidDataToPad.mockReturnValue([]);

      const appConfig = config.getConfig();
      expect(appConfig.diagnosticMode).toBe(true);

      await controller.start({ vendorId: 0x12ba, productId: 0x0210 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DIAGNOSTIC MODE ENABLED')
      );

      controller.stop();
      jest.runAllTimers();
    });

    test('should not log diagnostic message when DIAGNOSTIC_MODE not set', async () => {
      delete process.env.DIAGNOSTIC_MODE;
      const config = require('../src/config');
      const detect = require('../src/detect');
      const midiOutput = require('../src/midiOutput');
      const mapper = require('../src/mapper');
      const controller = require('../src/controller');

      const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
      detect.openDevice.mockReturnValue(mockDevice);
      midiOutput.initMidiOutput.mockImplementation(() => {});
      midiOutput.closeMidiOutput.mockImplementation(() => {});
      mapper.mapHidDataToPad.mockReturnValue([]);

      const appConfig = config.getConfig();
      expect(appConfig.diagnosticMode).toBe(false);

      await controller.start({ vendorId: 0x12ba, productId: 0x0210 });

      const diagnosticLogs = consoleSpy.mock.calls.filter(call =>
        call[0].toString().includes('DIAGNOSTIC MODE')
      );
      expect(diagnosticLogs).toHaveLength(0);

      controller.stop();
      jest.runAllTimers();
    });
  });

  describe('polling rate logging', () => {
    test('should always log polling rate message', async () => {
      delete process.env.DEBUG;
      delete process.env.LOG_HID_DATA;
      const detect = require('../src/detect');
      const midiOutput = require('../src/midiOutput');
      const mapper = require('../src/mapper');
      const controller = require('../src/controller');

      const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
      detect.openDevice.mockReturnValue(mockDevice);
      midiOutput.initMidiOutput.mockImplementation(() => {});
      midiOutput.closeMidiOutput.mockImplementation(() => {});
      mapper.mapHidDataToPad.mockReturnValue([]);

      await controller.start({ vendorId: 0x12ba, productId: 0x0210 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Polling at')
      );

      controller.stop();
      jest.runAllTimers();
    });

    test('should reflect configured poll rate in message', async () => {
      process.env.POLL_RATE_HZ = '120';
      const detect = require('../src/detect');
      const midiOutput = require('../src/midiOutput');
      const mapper = require('../src/mapper');
      const controller = require('../src/controller');

      const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
      detect.openDevice.mockReturnValue(mockDevice);
      midiOutput.initMidiOutput.mockImplementation(() => {});
      midiOutput.closeMidiOutput.mockImplementation(() => {});
      mapper.mapHidDataToPad.mockReturnValue([]);

      await controller.start({ vendorId: 0x12ba, productId: 0x0210 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('120Hz')
      );

      controller.stop();
      jest.runAllTimers();
    });
  });

  describe('pad detection logging', () => {
    test('should log pad detected message when DEBUG=true', async () => {
      process.env.DEBUG = 'true';
      const detect = require('../src/detect');
      const midiOutput = require('../src/midiOutput');
      const mapper = require('../src/mapper');
      const controller = require('../src/controller');

      const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
      detect.openDevice.mockReturnValue(mockDevice);
      midiOutput.initMidiOutput.mockImplementation(() => {});
      midiOutput.closeMidiOutput.mockImplementation(() => {});

      const redPadData = Buffer.alloc(27);
      redPadData[0] = 4;
      mockDevice.readSync.mockReturnValue(redPadData);
      mapper.mapHidDataToPad.mockReturnValue([{ padName: 'red', velocity: 100 }]);

      await controller.start({ vendorId: 0x12ba, productId: 0x0210 });
      jest.advanceTimersByTime(600);

      const padDetectionLogs = consoleSpy.mock.calls.filter(call =>
        call[0].toString().includes('Pad detected')
      );
      expect(padDetectionLogs.length).toBeGreaterThan(0);

      controller.stop();
      jest.runAllTimers();
    });

    test('should not log pad detected message when DEBUG not set', async () => {
      delete process.env.DEBUG;
      const detect = require('../src/detect');
      const midiOutput = require('../src/midiOutput');
      const mapper = require('../src/mapper');
      const controller = require('../src/controller');

      const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
      detect.openDevice.mockReturnValue(mockDevice);
      midiOutput.initMidiOutput.mockImplementation(() => {});
      midiOutput.closeMidiOutput.mockImplementation(() => {});

      const redPadData = Buffer.alloc(27);
      redPadData[0] = 4;
      mockDevice.readSync.mockReturnValue(redPadData);
      mapper.mapHidDataToPad.mockReturnValue([{ padName: 'red', velocity: 100 }]);

      await controller.start({ vendorId: 0x12ba, productId: 0x0210 });
      jest.advanceTimersByTime(600);

      const padDetectionLogs = consoleSpy.mock.calls.filter(call =>
        call[0].toString().includes('Pad detected')
      );
      expect(padDetectionLogs).toHaveLength(0);

      controller.stop();
      jest.runAllTimers();
    });

    test('should log non-zero bytes when DEBUG=true', async () => {
      process.env.DEBUG = 'true';
      const detect = require('../src/detect');
      const midiOutput = require('../src/midiOutput');
      const mapper = require('../src/mapper');
      const controller = require('../src/controller');

      const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
      detect.openDevice.mockReturnValue(mockDevice);
      midiOutput.initMidiOutput.mockImplementation(() => {});
      midiOutput.closeMidiOutput.mockImplementation(() => {});

      const redPadData = Buffer.alloc(27);
      redPadData[0] = 4;
      redPadData[7] = 50;
      mockDevice.readSync.mockReturnValue(redPadData);
      mapper.mapHidDataToPad.mockReturnValue([{ padName: 'red', velocity: 100 }]);

      await controller.start({ vendorId: 0x12ba, productId: 0x0210 });
      jest.advanceTimersByTime(600);

      const nonZeroLogs = consoleSpy.mock.calls.filter(call =>
        call[0].toString().includes('Non-zero bytes')
      );
      expect(nonZeroLogs.length).toBeGreaterThan(0);

      controller.stop();
      jest.runAllTimers();
    });
  });

  describe('appConfig consistency', () => {
    test('diagnosticMode in appConfig should match DIAGNOSTIC_MODE env var', () => {
      process.env.DIAGNOSTIC_MODE = 'true';
      const config = require('../src/config');
      const appConfig = config.getConfig();
      expect(appConfig.diagnosticMode).toBe(true);
    });

    test('debug in appConfig should match DEBUG env var', () => {
      process.env.DEBUG = 'true';
      const config = require('../src/config');
      const appConfig = config.getConfig();
      expect(appConfig.debug).toBe(true);
    });

    test('logHidData in appConfig should match LOG_HID_DATA env var', () => {
      process.env.LOG_HID_DATA = 'true';
      const config = require('../src/config');
      const appConfig = config.getConfig();
      expect(appConfig.logHidData).toBe(true);
    });

    test('pollRateHz in appConfig should match POLL_RATE_HZ env var', () => {
      process.env.POLL_RATE_HZ = '90';
      const config = require('../src/config');
      const appConfig = config.getConfig();
      expect(appConfig.pollRateHz).toBe(90);
    });
  });
});
