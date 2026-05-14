/**
 * Logger Module
 * Provides throttled logging functions with functional programming patterns
 */

const createThrottler = (intervalMs) => {
  let lastTime = -Infinity;
  return (now) => {
    if (now - lastTime >= intervalMs) {
      lastTime = now;
      return true;
    }
    return false;
  };
};

const createConditionalLogger = (condition, logFn) => (...args) => {
  if (condition) {
    logFn(...args);
  }
};

const createThrottledLogger = (intervalMs, logFn) => {
  const shouldLog = createThrottler(intervalMs);
  return (now, ...args) => {
    if (shouldLog(now)) {
      logFn(...args);
    }
  };
};

const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

const createFilteredLogger = (filter, logFn) => (...args) => {
  if (filter(...args)) {
    logFn(...args);
  }
};

module.exports = {
  createThrottler,
  createConditionalLogger,
  createThrottledLogger,
  createFilteredLogger,
  compose,

  diagnosticModeLogger: (appConfig) =>
    createConditionalLogger(
      appConfig.diagnosticMode,
      (msg) => console.log(msg)
    ),

  rawHidLogger: (appConfig) => {
    const logIfEnabled = createConditionalLogger(
      appConfig.logHidData,
      (msg) => console.log(msg)
    );
    return (hidHex, nonZeroBytes) => {
      logIfEnabled(`📦 Raw HID: ${hidHex}`);
      if (nonZeroBytes) {
        logIfEnabled(`   Non-zero: ${nonZeroBytes}`);
      }
    };
  },

  padDetectionLogger: (appConfig) => {
    const throttledLog = createThrottledLogger(
      500,
      (padName, rawVelocity, nonZeroBytes) => {
        console.log(`📍 Pad detected: ${padName} (raw velocity: ${rawVelocity})`);
        if (nonZeroBytes && nonZeroBytes.length > 0) {
          console.log(`    Non-zero bytes: ${nonZeroBytes.join(', ')}`);
        }
      }
    );
    return (now, padName, rawVelocity, nonZeroBytes) => {
      if (appConfig.debug) {
        throttledLog(now, padName, rawVelocity, nonZeroBytes);
      }
    };
  },

  midiPressLogger: (appConfig) =>
    createConditionalLogger(
      appConfig.debug,
      (padName, midiNote, velocity) => {
        console.log(`🥁 ${padName} pressed → MIDI note ${midiNote} (velocity ${velocity})`);
      }
    ),

  midiReleaseLogger: (appConfig) =>
    createConditionalLogger(
      appConfig.debug,
      (padName, midiNote) => {
        console.log(`🥁 ${padName} released → MIDI note-off ${midiNote}`);
      }
    ),

  pollingStartLogger: (pollRateHz, pollRateMs) => {
    console.log(`📊 Polling at ${pollRateHz}Hz (${pollRateMs}ms interval)`);
  },

  controllerStopLogger: () => {
    console.log('Controller stopped');
  },

  errorLogger: (context, error) => {
    console.error(`${context}:`, error.message);
  },
};
