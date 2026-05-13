/**
 * Mapper Tests
 * Unit tests for HID data to MIDI note mapping
 */

const mapper = require('../src/mapper');

describe('Mapper', () => {
  describe('mapPadToNote', () => {
    test('should map red pad to MIDI note 38 (snare drum)', () => {
      const note = mapper.mapPadToNote('red');
      expect(note).toBe(38);
    });

    test('should map yellow pad to MIDI note 42 (closed hi-hat)', () => {
      const note = mapper.mapPadToNote('yellow');
      expect(note).toBe(42);
    });

    test('should map blue pad to MIDI note 48 (tom-tom high)', () => {
      const note = mapper.mapPadToNote('blue');
      expect(note).toBe(48);
    });

    test('should map green pad to MIDI note 49 (crash cymbal 1)', () => {
      const note = mapper.mapPadToNote('green');
      expect(note).toBe(49);
    });

    test('should map kick pedal to MIDI note 36 (bass drum)', () => {
      const note = mapper.mapPadToNote('kick');
      expect(note).toBe(36);
    });

    test('should map cymbal to MIDI note 49 (crash cymbal 1)', () => {
      const note = mapper.mapPadToNote('cymbal');
      expect(note).toBe(49);
    });

    test('should throw error for unknown pad name', () => {
      expect(() => {
        mapper.mapPadToNote('unknown');
      }).toThrow('Unknown pad: unknown');
    });
  });

  describe('getVelocity', () => {
    test('should return default velocity when no pressure provided', () => {
      const velocity = mapper.getVelocity();
      expect(velocity).toBe(100);
    });

    test('should return velocity between 10 and 127', () => {
      const velocity = mapper.getVelocity(128);
      expect(velocity).toBeGreaterThanOrEqual(10);
      expect(velocity).toBeLessThanOrEqual(127);
    });

    test('should scale pressure 0-255 to velocity 10-127', () => {
      const velocityLow = mapper.getVelocity(0);
      const velocityMid = mapper.getVelocity(128);
      const velocityHigh = mapper.getVelocity(255);

      expect(velocityLow).toBeLessThanOrEqual(velocityMid);
      expect(velocityMid).toBeLessThanOrEqual(velocityHigh);
    });
  });

  describe('mapHidDataToPad', () => {
    test('should return null when byte[0] is 0', () => {
      const data = Buffer.alloc(27);
      data[2] = 8;   // blue X (stuck, ignored)
      data[3] = 128; // pressure (ignored)
      const result = mapper.mapHidDataToPad(data);
      expect(result).toBeNull();
    });

    test('should detect byte[0] = 1 (blue pad - tom-tom)', () => {
      const data = Buffer.alloc(27);
      data[0] = 1;
      const result = mapper.mapHidDataToPad(data);
      expect(result).toEqual({ padName: 'blue', velocity: 1 });
    });

    test('should detect byte[0] = 2 (green pad - crash cymbal)', () => {
      const data = Buffer.alloc(27);
      data[0] = 2;
      const result = mapper.mapHidDataToPad(data);
      expect(result).toEqual({ padName: 'green', velocity: 2 });
    });

    test('should detect byte[0] = 4 (red pad - snare drum)', () => {
      const data = Buffer.alloc(27);
      data[0] = 4;
      const result = mapper.mapHidDataToPad(data);
      expect(result).toEqual({ padName: 'red', velocity: 4 });
    });

    test('should detect byte[0] = 8 (yellow pad - hi-hat)', () => {
      const data = Buffer.alloc(27);
      data[0] = 8;
      const result = mapper.mapHidDataToPad(data);
      expect(result).toEqual({ padName: 'yellow', velocity: 8 });
    });

    test('should detect byte[0] = 16 (kick pedal - bass drum)', () => {
      const data = Buffer.alloc(27);
      data[0] = 16;
      const result = mapper.mapHidDataToPad(data);
      expect(result).toEqual({ padName: 'kick', velocity: 16 });
    });

    test('should ignore constant bytes (2, 3-6, 20-26)', () => {
      const data = Buffer.alloc(27);
      data[2] = 8;   // blue X (stuck, ignored)
      data[3] = 128; // pressure (ignored)
      data[4] = 128;
      data[5] = 128;
      data[6] = 128;
      data[20] = 2;  // baseline (ignored)
      data[22] = 2;
      data[24] = 2;
      data[26] = 2;
      const result = mapper.mapHidDataToPad(data);
      expect(result).toBeNull();
    });

    test('should return null for empty buffer', () => {
      const result = mapper.mapHidDataToPad(Buffer.from([]));
      expect(result).toBeNull();
    });

    test('should return null for null data', () => {
      const result = mapper.mapHidDataToPad(null);
      expect(result).toBeNull();
    });

    test('should return null for unknown byte[0] value', () => {
      const data = Buffer.alloc(27);
      data[0] = 99; // undefined value
      const result = mapper.mapHidDataToPad(data);
      expect(result).toBeNull();
    });
  });
});
