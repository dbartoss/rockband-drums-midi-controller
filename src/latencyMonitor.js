/**
 * Latency Monitor
 * Measures and reports timing information throughout the MIDI pipeline
 * Helps identify bottlenecks between pad press and MIDI output
 */

const logger = require('./logger');

const createLatencyTracker = (name, thresholdMs = 0) => {
  const measurements = [];

  return {
    start: () => {
      return Date.now();
    },

    end: (startTime, metadata = {}) => {
      const duration = Date.now() - startTime;
      measurements.push({ duration, timestamp: Date.now(), ...metadata });

      if (duration > thresholdMs) {
        return { duration, exceeded: true };
      }
      return { duration, exceeded: false };
    },

    getStats: () => {
      if (measurements.length === 0) return null;

      const durations = measurements.map(m => m.duration);
      const sorted = [...durations].sort((a, b) => a - b);

      return {
        count: measurements.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        measurements: measurements.slice(-100), // Keep last 100
      };
    },

    reset: () => {
      measurements.length = 0;
    },

    report: function(title = name) {
      reportLatencyStats(title, this.getStats());
    },
  };
};

const createPipelineTimer = () => {
  let stages = {};

  return {
    markStage: (stageName, timestamp = Date.now()) => {
      if (!stages[stageName]) {
        stages[stageName] = [];
      }
      stages[stageName].push(timestamp);
    },

    getLatencyBetween: (startStage, endStage) => {
      const starts = stages[startStage];
      const ends = stages[endStage];

      if (!starts || !ends || starts.length === 0 || ends.length === 0) {
        return null;
      }

      const lastStart = starts[starts.length - 1];
      const firstEndAfter = ends.find(t => t > lastStart);

      if (!firstEndAfter) return null;

      return firstEndAfter - lastStart;
    },

    reset: () => {
      stages = {};
    },

    getReport: () => {
      return stages;
    },
  };
};

const reportLatencyStats = (title, stats) => {
  if (!stats) {
    console.log(`${title}: No measurements yet`);
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Latency Report: ${title}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Measurements: ${stats.count}`);
  console.log(`Min:          ${stats.min}ms`);
  console.log(`Max:          ${stats.max}ms`);
  console.log(`Avg:          ${stats.avg.toFixed(2)}ms`);
  console.log(`Median:       ${stats.median}ms`);
  console.log(`P95:          ${stats.p95}ms`);
  console.log(`P99:          ${stats.p99}ms`);
  console.log(`${'='.repeat(60)}\n`);
};

const createLatencyAggregator = () => {
  const trackers = {};

  return {
    getTracker: (name, threshold = 0) => {
      if (!trackers[name]) {
        trackers[name] = createLatencyTracker(name, threshold);
      }
      return trackers[name];
    },

    reportAll: () => {
      console.log('\n\n');
      console.log('╔' + '═'.repeat(58) + '╗');
      console.log('║' + ' '.repeat(58) + '║');
      console.log('║  ' + 'COMPLETE LATENCY ANALYSIS'.padEnd(56) + '║');
      console.log('║' + ' '.repeat(58) + '║');
      console.log('╚' + '═'.repeat(58) + '╝');

      Object.entries(trackers).forEach(([name, tracker]) => {
        tracker.report(name);
      });
    },

    resetAll: () => {
      Object.values(trackers).forEach(t => t.reset());
    },

    getStats: (name) => {
      if (!trackers[name]) return null;
      return trackers[name].getStats();
    },
  };
};

module.exports = {
  createLatencyTracker,
  createPipelineTimer,
  createLatencyAggregator,
  reportLatencyStats,
};
