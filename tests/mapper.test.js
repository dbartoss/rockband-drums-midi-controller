/**
 * Mapper Tests
 * Unit tests for HID data to MIDI note mapping
 */

const mapper = require('../src/mapper');

describe('Mapper', () => {
  describe('mapPadToNote', () => {
    test('should map red pad to MIDI note 36 (bass drum)', () => {
      const note = mapper.mapPadToNote('red');
      expect(note).toBe(36);
    });

    test('should map yellow pad to MIDI note 41 (low tom)', () => {
      const note = mapper.mapPadToNote('yellow');
      expect(note).toBe(41);
    });

    test('should map blue pad to MIDI note 48 (high tom)', () => {
      const note = mapper.mapPadToNote('blue');
      expect(note).toBe(48);
    });

    test('should map green pad to MIDI note 45 (low-mid tom)', () => {
      const note = mapper.mapPadToNote('green');
      expect(note).toBe(45);
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
    test('should return null during discovery phase (placeholder)', () => {
      const result = mapper.mapHidDataToPad(Buffer.from([0, 0, 0]));
      expect(result).toBeNull();
    });
  });
});
