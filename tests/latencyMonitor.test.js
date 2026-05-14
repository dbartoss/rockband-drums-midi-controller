/**
 * Latency Monitor Tests
 * Unit tests for latency tracking and measurement
 */

const latencyMonitor = require('../src/latencyMonitor');

describe('Latency Monitor', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('createLatencyTracker', () => {
    test('should measure duration between start and end', () => {
      const tracker = latencyMonitor.createLatencyTracker('test');
      const start = tracker.start();
      jest.advanceTimersByTime(10);
      const result = tracker.end(start);
      expect(result.duration).toBeGreaterThanOrEqual(10);
    });

    test('should return exceeded flag when duration exceeds threshold', () => {
      jest.useFakeTimers();
      const tracker = latencyMonitor.createLatencyTracker('test', 5);
      const start = tracker.start();
      jest.advanceTimersByTime(10);
      const result = tracker.end(start);
      expect(result.exceeded).toBe(true);
      jest.useRealTimers();
    });

    test('should return not exceeded flag when duration is below threshold', () => {
      jest.useFakeTimers();
      const tracker = latencyMonitor.createLatencyTracker('test', 20);
      const start = tracker.start();
      jest.advanceTimersByTime(10);
      const result = tracker.end(start);
      expect(result.exceeded).toBe(false);
      jest.useRealTimers();
    });

    test('should store metadata with measurements', () => {
      jest.useFakeTimers();
      const tracker = latencyMonitor.createLatencyTracker('test');
      const start = tracker.start();
      jest.advanceTimersByTime(5);
      tracker.end(start, { padName: 'red' });
      const stats = tracker.getStats();
      expect(stats.measurements[0].padName).toBe('red');
      jest.useRealTimers();
    });

    test('should calculate correct statistics', () => {
      jest.useFakeTimers();
      const tracker = latencyMonitor.createLatencyTracker('test');

      for (let i = 0; i < 10; i++) {
        const start = tracker.start();
        jest.advanceTimersByTime(i + 1);
        tracker.end(start);
      }

      const stats = tracker.getStats();
      expect(stats.count).toBe(10);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(10);
      expect(stats.avg).toBeCloseTo(5.5, 0);
      jest.useRealTimers();
    });

    test('should calculate percentiles', () => {
      jest.useFakeTimers();
      const tracker = latencyMonitor.createLatencyTracker('test');

      for (let i = 0; i < 100; i++) {
        const start = tracker.start();
        jest.advanceTimersByTime(1);
        tracker.end(start);
      }

      const stats = tracker.getStats();
      expect(stats.p95).toBeLessThanOrEqual(stats.max);
      expect(stats.p99).toBeLessThanOrEqual(stats.max);
      expect(stats.median).toBeGreaterThanOrEqual(stats.min);
      jest.useRealTimers();
    });

    test('should keep only last 100 measurements', () => {
      jest.useFakeTimers();
      const tracker = latencyMonitor.createLatencyTracker('test');

      for (let i = 0; i < 150; i++) {
        const start = tracker.start();
        jest.advanceTimersByTime(1);
        tracker.end(start);
      }

      const stats = tracker.getStats();
      expect(stats.measurements.length).toBeLessThanOrEqual(100);
      jest.useRealTimers();
    });

    test('should reset measurements', () => {
      jest.useFakeTimers();
      const tracker = latencyMonitor.createLatencyTracker('test');
      const start = tracker.start();
      jest.advanceTimersByTime(10);
      tracker.end(start);

      expect(tracker.getStats()).not.toBeNull();
      tracker.reset();
      expect(tracker.getStats()).toBeNull();
      jest.useRealTimers();
    });

    test('should return null stats when no measurements', () => {
      const tracker = latencyMonitor.createLatencyTracker('test');
      expect(tracker.getStats()).toBeNull();
    });
  });

  describe('createPipelineTimer', () => {
    test('should mark stages with timestamps', () => {
      const timer = latencyMonitor.createPipelineTimer();
      timer.markStage('start', 100);
      timer.markStage('middle', 110);
      timer.markStage('end', 120);
      const report = timer.getReport();
      expect(report.start).toEqual([100]);
      expect(report.middle).toEqual([110]);
      expect(report.end).toEqual([120]);
    });

    test('should calculate latency between stages', () => {
      const timer = latencyMonitor.createPipelineTimer();
      timer.markStage('read', 100);
      timer.markStage('map', 105);
      timer.markStage('send', 112);
      const latency = timer.getLatencyBetween('read', 'send');
      expect(latency).toBe(12);
    });

    test('should return null when stage not found', () => {
      const timer = latencyMonitor.createPipelineTimer();
      timer.markStage('start', 100);
      const latency = timer.getLatencyBetween('start', 'nonexistent');
      expect(latency).toBeNull();
    });

    test('should return null when end stage before start stage', () => {
      const timer = latencyMonitor.createPipelineTimer();
      timer.markStage('start', 100);
      timer.markStage('end', 90);
      const latency = timer.getLatencyBetween('start', 'end');
      expect(latency).toBeNull();
    });

    test('should handle multiple marks per stage', () => {
      const timer = latencyMonitor.createPipelineTimer();
      timer.markStage('read', 100);
      timer.markStage('map', 105);
      timer.markStage('read', 110);
      timer.markStage('map', 115);
      const latency = timer.getLatencyBetween('read', 'map');
      expect(latency).toBe(5);
    });

    test('should reset stages', () => {
      const timer = latencyMonitor.createPipelineTimer();
      timer.markStage('start', 100);
      timer.reset();
      const report = timer.getReport();
      expect(Object.keys(report).length).toBe(0);
    });
  });

  describe('createLatencyAggregator', () => {
    test('should create and reuse trackers', () => {
      const agg = latencyMonitor.createLatencyAggregator();
      const tracker1 = agg.getTracker('test');
      const tracker2 = agg.getTracker('test');
      expect(tracker1).toBe(tracker2);
    });

    test('should get stats from tracker', () => {
      jest.useFakeTimers();
      const agg = latencyMonitor.createLatencyAggregator();
      const tracker = agg.getTracker('test');
      const start = tracker.start();
      jest.advanceTimersByTime(10);
      tracker.end(start);
      const stats = agg.getStats('test');
      expect(stats).not.toBeNull();
      expect(stats.count).toBe(1);
      jest.useRealTimers();
    });

    test('should reset all trackers', () => {
      jest.useFakeTimers();
      const agg = latencyMonitor.createLatencyAggregator();
      const tracker1 = agg.getTracker('test1');
      const tracker2 = agg.getTracker('test2');
      const start1 = tracker1.start();
      const start2 = tracker2.start();
      jest.advanceTimersByTime(5);
      tracker1.end(start1);
      tracker2.end(start2);
      expect(agg.getStats('test1')).not.toBeNull();
      expect(agg.getStats('test2')).not.toBeNull();
      agg.resetAll();
      expect(agg.getStats('test1')).toBeNull();
      expect(agg.getStats('test2')).toBeNull();
      jest.useRealTimers();
    });

    test('should report all trackers', () => {
      jest.useFakeTimers();
      const agg = latencyMonitor.createLatencyAggregator();
      const tracker = agg.getTracker('test');
      const start = tracker.start();
      jest.advanceTimersByTime(10);
      tracker.end(start);
      agg.reportAll();
      expect(consoleLogSpy).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('reportLatencyStats', () => {
    test('should handle null stats', () => {
      latencyMonitor.reportLatencyStats('test', null);
      expect(consoleLogSpy).toHaveBeenCalledWith('test: No measurements yet');
    });

    test('should report all statistics', () => {
      jest.useFakeTimers();
      const tracker = latencyMonitor.createLatencyTracker('test');
      const start = tracker.start();
      jest.advanceTimersByTime(10);
      tracker.end(start);
      latencyMonitor.reportLatencyStats('test', tracker.getStats());
      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(calls).toContain('Measurements');
      expect(calls).toContain('Min:');
      expect(calls).toContain('Max:');
      jest.useRealTimers();
    });
  });
});
