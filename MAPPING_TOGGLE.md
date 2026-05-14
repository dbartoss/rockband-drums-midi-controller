# Drum Mapping Mode Toggle

Switch between **Game-Based** and **Realistic** drum pad mappings at runtime.

## Quick Start

### Option 1: Environment Variable (Startup)

```bash
# Start with realistic mapping (default)
npm start

# Start with game-based mapping
DRUM_MAPPING_MODE=game-based npm start

# Explicitly use realistic
DRUM_MAPPING_MODE=realistic npm start
```

### Option 2: Programmatically (While Running)

```javascript
const mapper = require('./src/mapper');

// Get current mode
console.log(mapper.getMappingMode()); // 'realistic'

// Switch to game-based
mapper.setMappingMode('game-based');
console.log(mapper.getMappingMode()); // 'game-based'

// Switch back to realistic
mapper.setMappingMode('realistic');
console.log(mapper.getMappingMode()); // 'realistic'

// See available modes
console.log(mapper.getAvailableModes()); // ['game-based', 'realistic']
```

## Mapping Comparison

| Pad | Realistic | Game-Based |
|-----|-----------|-----------|
| **Red** | 42 (Hi-Hat) | 38 (Snare) |
| **Yellow** | 45 (Tom) | 42 (Hi-Hat) |
| **Blue** | 38 (Snare) | 48 (Tom) |
| **Green** | 49 (Crash) | 49 (Crash) |
| **Kick** | 36 (Bass) | 36 (Bass) |

## API

### `getMappingMode()`

Returns the current mapping mode as a string.

```javascript
const mode = mapper.getMappingMode();
// Returns: 'realistic' or 'game-based'
```

### `setMappingMode(mode)`

Switch to a different mapping mode. Changes take effect immediately.

```javascript
mapper.setMappingMode('game-based');
// All subsequent mapPadToNote() calls use game-based mappings

mapper.setMappingMode('realistic');
// All subsequent mapPadToNote() calls use realistic mappings
```

**Throws** if mode is invalid:
```javascript
mapper.setMappingMode('invalid-mode');
// Error: Unknown mapping mode: invalid-mode. Valid modes: game-based, realistic
```

### `getAvailableModes()`

Returns an array of all available mapping modes.

```javascript
const modes = mapper.getAvailableModes();
// Returns: ['game-based', 'realistic']
```

## Use Cases

### During Development/Testing
```bash
# Test game-based mode
DRUM_MAPPING_MODE=game-based npm start

# Then switch to realistic
DRUM_MAPPING_MODE=realistic npm start
```

### In a CLI Application
```javascript
// Allow user to choose at startup
const mode = process.argv[2] || 'realistic';
mapper.setMappingMode(mode);
```

### Interactive Mode Switching
```javascript
// In a real-time application, toggle between modes
function toggleMappingMode() {
  const current = mapper.getMappingMode();
  const next = current === 'realistic' ? 'game-based' : 'realistic';
  mapper.setMappingMode(next);
  console.log(`Switched to ${next} mode`);
}

// Call toggleMappingMode() on user input
```

## How It Works

1. **Environment Variable**: `DRUM_MAPPING_MODE` is read from your `.env` file or shell environment
2. **Config Loading**: `config.getConfig()` reads the current mode
3. **Mapping Lookup**: `mapPadToNote(padName)` looks up the pad's MIDI note based on the current mode
4. **Runtime Switching**: `setMappingMode()` updates `process.env.DRUM_MAPPING_MODE` immediately

All subsequent pad mappings respect the new mode.

## Default Behavior

- **Default Mode**: `realistic`
- If `DRUM_MAPPING_MODE` is not set, realistic mappings are used
- The `.env` file can set a default: `DRUM_MAPPING_MODE=game-based`

## Testing

The mapping mode system is fully tested with 23 unit tests covering:
- Getting the current mode
- Setting a new mode
- Validating mode names
- Verifying MIDI note mappings for each mode
- Switching modes multiple times
- Error handling for invalid modes

Run the mapping mode tests:
```bash
npm test -- tests/mappingMode.test.js
```

## See Also

- `DRUM_MAPPING.md` — Detailed explanation of both mapping modes
- `MAPPING_COMPARISON.md` — Side-by-side comparison with diagrams
- `DRUM_ERGONOMICS.md` — Why ergonomics matter for drum mapping
- `config/drumMapping.json` — The configuration file with both modes defined
- `src/mapper.js` — The mapper module with toggle functions
