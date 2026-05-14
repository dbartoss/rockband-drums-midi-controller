/**
 * Logger Tests
 * Unit tests for logger module with throttling and functional programming patterns
 */

const logger = require('../src/logger');

describe('Logger', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('createThrottler', () => {
    test('should return true on first call', () => {
      const throttler = logger.createThrottler(100);
      expect(throttler(0)).toBe(true);
    });

    test('should return false on immediate second call', () => {
      const throttler = logger.createThrottler(100);
      throttler(0);
      expect(throttler(50)).toBe(false);
    });

    test('should return true after interval has passed', () => {
      const throttler = logger.createThrottler(100);
      throttler(0);
      expect(throttler(100)).toBe(true);
    });

    test('should maintain separate state per instance', () => {
      const throttler1 = logger.createThrottler(100);
      const throttler2 = logger.createThrottler(100);

      throttler1(0);
      expect(throttler2(50)).toBe(true);
    });
  });

  describe('createConditionalLogger', () => {
    test('should log when condition is true', () => {
      const logFn = jest.fn();
      const conditionalLog = logger.createConditionalLogger(true, logFn);
      conditionalLog('test message');
      expect(logFn).toHaveBeenCalledWith('test message');
    });

    test('should not log when condition is false', () => {
      const logFn = jest.fn();
      const conditionalLog = logger.createConditionalLogger(false, logFn);
      conditionalLog('test message');
      expect(logFn).not.toHaveBeenCalled();
    });

    test('should handle multiple arguments', () => {
      const logFn = jest.fn();
      const conditionalLog = logger.createConditionalLogger(true, logFn);
      conditionalLog('msg1', 'msg2', 'msg3');
      expect(logFn).toHaveBeenCalledWith('msg1', 'msg2', 'msg3');
    });
  });

  describe('createThrottledLogger', () => {
    test('should log on first call', () => {
      const logFn = jest.fn();
      const throttledLog = logger.createThrottledLogger(100, logFn);
      throttledLog(0, 'message');
      expect(logFn).toHaveBeenCalledWith('message');
    });

    test('should not log before interval passes', () => {
      const logFn = jest.fn();
      const throttledLog = logger.createThrottledLogger(100, logFn);
      throttledLog(0, 'message1');
      throttledLog(50, 'message2');
      expect(logFn).toHaveBeenCalledTimes(1);
    });

    test('should log after interval passes', () => {
      const logFn = jest.fn();
      const throttledLog = logger.createThrottledLogger(100, logFn);
      throttledLog(0, 'message1');
      throttledLog(100, 'message2');
      expect(logFn).toHaveBeenCalledTimes(2);
      expect(logFn).toHaveBeenNthCalledWith(1, 'message1');
      expect(logFn).toHaveBeenNthCalledWith(2, 'message2');
    });

    test('should handle multiple arguments', () => {
      const logFn = jest.fn();
      const throttledLog = logger.createThrottledLogger(100, logFn);
      throttledLog(0, 'arg1', 'arg2', 'arg3');
      expect(logFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });

  describe('createFilteredLogger', () => {
    test('should log when filter returns true', () => {
      const logFn = jest.fn();
      const filter = (msg) => msg.length > 3;
      const filteredLog = logger.createFilteredLogger(filter, logFn);
      filteredLog('long message');
      expect(logFn).toHaveBeenCalledWith('long message');
    });

    test('should not log when filter returns false', () => {
      const logFn = jest.fn();
      const filter = (msg) => msg.length > 10;
      const filteredLog = logger.createFilteredLogger(filter, logFn);
      filteredLog('short');
      expect(logFn).not.toHaveBeenCalled();
    });
  });

  describe('diagnosticModeLogger', () => {
    test('should log when diagnosticMode is true', () => {
      const appConfig = { diagnosticMode: true };
      const diagLogger = logger.diagnosticModeLogger(appConfig);
      diagLogger('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('test message');
    });

    test('should not log when diagnosticMode is false', () => {
      const appConfig = { diagnosticMode: false };
      const diagLogger = logger.diagnosticModeLogger(appConfig);
      diagLogger('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('rawHidLogger', () => {
    test('should log HID data when logHidData is true', () => {
      const appConfig = { logHidData: true };
      const hidLogger = logger.rawHidLogger(appConfig);
      hidLogger('abc123', '');
      expect(consoleLogSpy).toHaveBeenCalledWith('📦 Raw HID: abc123');
    });

    test('should not log HID data when logHidData is false', () => {
      const appConfig = { logHidData: false };
      const hidLogger = logger.rawHidLogger(appConfig);
      hidLogger('abc123', '');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test('should log non-zero bytes when provided', () => {
      const appConfig = { logHidData: true };
      const hidLogger = logger.rawHidLogger(appConfig);
      hidLogger('abc123', '[0]:4 [7]:128');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Non-zero: [0]:4 [7]:128');
    });

    test('should not log non-zero bytes when empty', () => {
      const appConfig = { logHidData: true };
      const hidLogger = logger.rawHidLogger(appConfig);
      hidLogger('abc123', '');
      const calls = consoleLogSpy.mock.calls.filter(c => c[0].includes('Non-zero'));
      expect(calls).toHaveLength(0);
    });
  });

  describe('padDetectionLogger', () => {
    test('should log pad detection when debug is true', () => {
      const appConfig = { debug: true };
      const padLogger = logger.padDetectionLogger(appConfig);
      padLogger(0, 'red', 100, []);
      expect(consoleLogSpy).toHaveBeenCalledWith('📍 Pad detected: red (raw velocity: 100)');
    });

    test('should not log pad detection when debug is false', () => {
      const appConfig = { debug: false };
      const padLogger = logger.padDetectionLogger(appConfig);
      padLogger(0, 'red', 100, []);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test('should throttle calls to 500ms', () => {
      const appConfig = { debug: true };
      const padLogger = logger.padDetectionLogger(appConfig);
      padLogger(0, 'red', 100, []);
      padLogger(100, 'red', 100, []);
      padLogger(500, 'red', 100, []);
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    test('should log non-zero bytes', () => {
      const appConfig = { debug: true };
      const padLogger = logger.padDetectionLogger(appConfig);
      padLogger(0, 'red', 100, ['[0]=4', '[7]=128']);
      expect(consoleLogSpy).toHaveBeenCalledWith('    Non-zero bytes: [0]=4, [7]=128');
    });
  });

  describe('midiPressLogger', () => {
    test('should log MIDI press when debug is true', () => {
      const appConfig = { debug: true };
      const pressLogger = logger.midiPressLogger(appConfig);
      pressLogger('red', 38, 100);
      expect(consoleLogSpy).toHaveBeenCalledWith('🥁 red pressed → MIDI note 38 (velocity 100)');
    });

    test('should not log MIDI press when debug is false', () => {
      const appConfig = { debug: false };
      const pressLogger = logger.midiPressLogger(appConfig);
      pressLogger('red', 38, 100);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('midiReleaseLogger', () => {
    test('should log MIDI release when debug is true', () => {
      const appConfig = { debug: true };
      const releaseLogger = logger.midiReleaseLogger(appConfig);
      releaseLogger('red', 38);
      expect(consoleLogSpy).toHaveBeenCalledWith('🥁 red released → MIDI note-off 38');
    });

    test('should not log MIDI release when debug is false', () => {
      const appConfig = { debug: false };
      const releaseLogger = logger.midiReleaseLogger(appConfig);
      releaseLogger('red', 38);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('pollingStartLogger', () => {
    test('should always log polling start message', () => {
      logger.pollingStartLogger(60, 16.67);
      expect(consoleLogSpy).toHaveBeenCalledWith('📊 Polling at 60Hz (16.67ms interval)');
    });

    test('should reflect correct poll rate', () => {
      logger.pollingStartLogger(120, 8.33);
      expect(consoleLogSpy).toHaveBeenCalledWith('📊 Polling at 120Hz (8.33ms interval)');
    });
  });

  describe('controllerStopLogger', () => {
    test('should log controller stop message', () => {
      logger.controllerStopLogger();
      expect(consoleLogSpy).toHaveBeenCalledWith('Controller stopped');
    });
  });

  describe('errorLogger', () => {
    test('should log error with context', () => {
      const error = new Error('test error');
      logger.errorLogger('Context', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Context:', 'test error');
    });

    test('should format error message correctly', () => {
      const error = new Error('something failed');
      logger.errorLogger('Operation failed', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Operation failed:', 'something failed');
    });
  });
});
