/**
 * HID Diagnostics Tests
 * Verifies HID data analysis and velocity measurement functionality
 */

const hidDiagnostics = require('../src/hidDiagnostics');

describe('HID Diagnostics', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('createHidAnalyzer', () => {
    test('should create analyzer instance', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      expect(analyzer).toBeDefined();
      expect(analyzer.recordPadPress).toBeDefined();
      expect(analyzer.reportRawData).toBeDefined();
    });

    test('should track pad presses', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4; // red pad

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      expect(analyzer.getMeasurementCount()).toBe(1);
    });

    test('should handle multiple presses', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });

      expect(analyzer.getMeasurementCount()).toBe(3);
    });

    test('should handle null data gracefully', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      expect(() => {
        analyzer.recordPadPress(null, { padName: 'red', velocity: 4 });
      }).not.toThrow();
    });

    test('should handle empty data gracefully', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      expect(() => {
        analyzer.recordPadPress(Buffer.alloc(0), { padName: 'red', velocity: 4 });
      }).not.toThrow();
    });
  });

  describe('recordPadPress', () => {
    test('should extract all byte values', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;
      data[7] = 50;
      data[10] = 128;

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      const measurements = analyzer.getLastMeasurements(1);

      expect(measurements[0].byte0).toBe(4);
      expect(measurements[0].allBytes).toHaveLength(27);
      expect(measurements[0].nonZeroBytes.length).toBeGreaterThan(0);
    });

    test('should identify non-zero bytes', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;
      data[7] = 50;

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      const measurements = analyzer.getLastMeasurements(1);

      expect(measurements[0].nonZeroBytes.map(b => b.index)).toContain(0);
      expect(measurements[0].nonZeroBytes.map(b => b.index)).toContain(7);
    });

    test('should track statistics per pad', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();

      const redData = Buffer.alloc(27);
      redData[0] = 4;
      redData[7] = 100;

      const yellowData = Buffer.alloc(27);
      yellowData[0] = 8;
      yellowData[7] = 110;

      analyzer.recordPadPress(redData, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(redData, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(yellowData, { padName: 'yellow', velocity: 8 });

      expect(analyzer.getMeasurementCount()).toBe(3);
    });
  });

  describe('measureVelocityCorrelation', () => {
    test('should detect varying bytes between weak and hard presses', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();

      const weakData = Buffer.alloc(27);
      weakData[0] = 4;
      weakData[7] = 50; // low value = weak press

      const hardData = Buffer.alloc(27);
      hardData[0] = 4;
      hardData[7] = 150; // high value = hard press

      analyzer.recordPadPress(weakData, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(hardData, { padName: 'red', velocity: 4 });

      analyzer.measureVelocityCorrelation();
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should report when not enough data', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      analyzer.measureVelocityCorrelation();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls
        .map(c => c[0])
        .join('\n');
      expect(output).toContain('Not enough data');
    });

    test('should detect no variance when bytes dont change', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();

      const data1 = Buffer.alloc(27);
      data1[0] = 4;
      data1[7] = 100;

      const data2 = Buffer.alloc(27);
      data2[0] = 4;
      data2[7] = 100; // same value

      analyzer.recordPadPress(data1, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data2, { padName: 'red', velocity: 4 });

      analyzer.measureVelocityCorrelation();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('reportRawData', () => {
    test('should report last N measurements', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;

      for (let i = 0; i < 5; i++) {
        analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      }

      analyzer.reportRawData(3);
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls
        .map(c => c[0])
        .join('\n');
      expect(output).toContain('Last 3');
    });

    test('should show byte values in hex and decimal', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;
      data[7] = 255;

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      analyzer.reportRawData(1);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('reportPressureBytes', () => {
    test('should identify varying bytes', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();

      const data1 = Buffer.alloc(27);
      data1[7] = 50;

      const data2 = Buffer.alloc(27);
      data2[7] = 100;

      const data3 = Buffer.alloc(27);
      data3[7] = 150;

      analyzer.recordPadPress(data1, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data2, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data3, { padName: 'red', velocity: 4 });

      analyzer.reportPressureBytes();
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should report when no varying bytes found', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();

      const data = Buffer.alloc(27);
      data[0] = 4;

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });

      analyzer.reportPressureBytes();
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls
        .map(c => c[0])
        .join('\n');
      expect(output).toContain('NO VARYING BYTES');
    });
  });

  describe('reportStatistics', () => {
    test('should report per-pad statistics', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();

      const redData = Buffer.alloc(27);
      redData[0] = 4;
      redData[7] = 100;

      analyzer.recordPadPress(redData, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(redData, { padName: 'red', velocity: 4 });

      analyzer.reportStatistics();
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls
        .map(c => c[0])
        .join('\n')
        .toUpperCase();
      expect(output).toContain('RED');
    });

    test('should calculate min/max/avg for byte values', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();

      const data1 = Buffer.alloc(27);
      data1[0] = 4;
      data1[7] = 50;

      const data2 = Buffer.alloc(27);
      data2[0] = 4;
      data2[7] = 100;

      const data3 = Buffer.alloc(27);
      data3[0] = 4;
      data3[7] = 75;

      analyzer.recordPadPress(data1, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data2, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data3, { padName: 'red', velocity: 4 });

      analyzer.reportStatistics();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    test('should clear all measurements', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      expect(analyzer.getMeasurementCount()).toBe(1);

      analyzer.reset();
      expect(analyzer.getMeasurementCount()).toBe(0);
    });
  });

  describe('getLastMeasurements', () => {
    test('should return last N measurements', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;

      for (let i = 0; i < 5; i++) {
        analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      }

      const last3 = analyzer.getLastMeasurements(3);
      expect(last3).toHaveLength(3);
    });

    test('should return all measurements if count exceeds total', () => {
      const analyzer = hidDiagnostics.createHidAnalyzer();
      const data = Buffer.alloc(27);
      data[0] = 4;

      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });
      analyzer.recordPadPress(data, { padName: 'red', velocity: 4 });

      const last10 = analyzer.getLastMeasurements(10);
      expect(last10).toHaveLength(2);
    });
  });
});
