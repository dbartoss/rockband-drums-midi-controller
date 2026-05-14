/**
 * Mapping Mode Toggle Tests
 * Unit tests for switching between game-based and realistic drum mappings
 */

const mapper = require('../src/mapper');

describe('Mapping Mode Toggle', () => {
  const originalMode = process.env.DRUM_MAPPING_MODE;

  beforeEach(() => {
    // Reset to realistic mode before each test
    process.env.DRUM_MAPPING_MODE = 'realistic';
  });

  afterEach(() => {
    // Restore original mode
    if (originalMode) {
      process.env.DRUM_MAPPING_MODE = originalMode;
    } else {
      delete process.env.DRUM_MAPPING_MODE;
    }
  });

  describe('getMappingMode', () => {
    test('should return realistic mode by default', () => {
      delete process.env.DRUM_MAPPING_MODE;
      const mode = mapper.getMappingMode();
      expect(mode).toBe('realistic');
    });

    test('should return current mode when set', () => {
      process.env.DRUM_MAPPING_MODE = 'game-based';
      const mode = mapper.getMappingMode();
      expect(mode).toBe('game-based');
    });

    test('should return realistic mode when explicitly set', () => {
      process.env.DRUM_MAPPING_MODE = 'realistic';
      const mode = mapper.getMappingMode();
      expect(mode).toBe('realistic');
    });
  });

  describe('getAvailableModes', () => {
    test('should return array of available modes', () => {
      const modes = mapper.getAvailableModes();
      expect(Array.isArray(modes)).toBe(true);
      expect(modes).toContain('game-based');
      expect(modes).toContain('realistic');
    });

    test('should have exactly 2 modes', () => {
      const modes = mapper.getAvailableModes();
      expect(modes).toHaveLength(2);
    });
  });

  describe('setMappingMode', () => {
    test('should switch to game-based mode', () => {
      mapper.setMappingMode('game-based');
      expect(mapper.getMappingMode()).toBe('game-based');
    });

    test('should switch to realistic mode', () => {
      process.env.DRUM_MAPPING_MODE = 'game-based';
      mapper.setMappingMode('realistic');
      expect(mapper.getMappingMode()).toBe('realistic');
    });

    test('should throw error for invalid mode', () => {
      expect(() => {
        mapper.setMappingMode('invalid-mode');
      }).toThrow('Unknown mapping mode: invalid-mode');
    });

    test('should throw error message including valid modes', () => {
      expect(() => {
        mapper.setMappingMode('invalid');
      }).toThrow(/game-based|realistic/);
    });
  });

  describe('mapPadToNote with mode switching', () => {
    test('realistic mode: red pad maps to 42 (hi-hat)', () => {
      mapper.setMappingMode('realistic');
      const note = mapper.mapPadToNote('red');
      expect(note).toBe(42);
    });

    test('realistic mode: yellow pad maps to 45 (tom)', () => {
      mapper.setMappingMode('realistic');
      const note = mapper.mapPadToNote('yellow');
      expect(note).toBe(45);
    });

    test('realistic mode: blue pad maps to 38 (snare)', () => {
      mapper.setMappingMode('realistic');
      const note = mapper.mapPadToNote('blue');
      expect(note).toBe(38);
    });

    test('realistic mode: green pad maps to 49 (crash)', () => {
      mapper.setMappingMode('realistic');
      const note = mapper.mapPadToNote('green');
      expect(note).toBe(49);
    });

    test('game-based mode: red pad maps to 38 (snare)', () => {
      mapper.setMappingMode('game-based');
      const note = mapper.mapPadToNote('red');
      expect(note).toBe(38);
    });

    test('game-based mode: yellow pad maps to 42 (hi-hat)', () => {
      mapper.setMappingMode('game-based');
      const note = mapper.mapPadToNote('yellow');
      expect(note).toBe(42);
    });

    test('game-based mode: blue pad maps to 48 (tom)', () => {
      mapper.setMappingMode('game-based');
      const note = mapper.mapPadToNote('blue');
      expect(note).toBe(48);
    });

    test('game-based mode: green pad maps to 49 (crash)', () => {
      mapper.setMappingMode('game-based');
      const note = mapper.mapPadToNote('green');
      expect(note).toBe(49);
    });

    test('both modes: kick pedal always maps to 36 (bass drum)', () => {
      mapper.setMappingMode('realistic');
      const realisticNote = mapper.mapPadToNote('kick');

      mapper.setMappingMode('game-based');
      const gameNote = mapper.mapPadToNote('kick');

      expect(realisticNote).toBe(36);
      expect(gameNote).toBe(36);
    });

    test('cymbal alias maps correctly in realistic mode', () => {
      mapper.setMappingMode('realistic');
      const greenNote = mapper.mapPadToNote('green');
      const cymbalNote = mapper.mapPadToNote('cymbal');
      expect(cymbalNote).toBe(greenNote);
    });

    test('cymbal alias maps correctly in game-based mode', () => {
      mapper.setMappingMode('game-based');
      const greenNote = mapper.mapPadToNote('green');
      const cymbalNote = mapper.mapPadToNote('cymbal');
      expect(cymbalNote).toBe(greenNote);
    });
  });

  describe('Mode switching mid-execution', () => {
    test('can switch modes multiple times in sequence', () => {
      mapper.setMappingMode('realistic');
      let note = mapper.mapPadToNote('red');
      expect(note).toBe(42);

      mapper.setMappingMode('game-based');
      note = mapper.mapPadToNote('red');
      expect(note).toBe(38);

      mapper.setMappingMode('realistic');
      note = mapper.mapPadToNote('red');
      expect(note).toBe(42);
    });

    test('different pads can be queried with different modes', () => {
      mapper.setMappingMode('realistic');
      const redRealistic = mapper.mapPadToNote('red');

      mapper.setMappingMode('game-based');
      const redGameBased = mapper.mapPadToNote('red');

      expect(redRealistic).not.toBe(redGameBased);
      expect(redRealistic).toBe(42);
      expect(redGameBased).toBe(38);
    });
  });

  describe('Mode persistence', () => {
    test('mode persists across multiple calls to getConfig', () => {
      mapper.setMappingMode('game-based');
      const config = require('../src/config');

      const mode1 = mapper.getMappingMode();
      const mode2 = mapper.getMappingMode();

      expect(mode1).toBe('game-based');
      expect(mode2).toBe('game-based');
    });
  });
});
