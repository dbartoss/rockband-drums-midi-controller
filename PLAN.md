# Rock Band Drums MIDI Controller - Implementation Plan

## Project Overview
Convert a PlayStation Rock Band drums controller into a universal MIDI controller using Node.js. This approach is:
- **Portable**: Works across FL Studio, Ableton, Studio One, etc.
- **Maintainable**: Pure code, no hardware soldering needed
- **Scalable**: Can add features/mappings easily
- **Leverages your skills**: Node.js + JavaScript

---

## Phase 1: Identification & Setup (Day 1)

### 1.1 Identify Your Hardware
**Goal**: Determine Rock Band drums version
- [ ] Connect drums via USB to computer
- [ ] Check in system preferences / device manager
- [ ] Run `system_profiler SPUSBDataType` (Mac) or `lsusb` (Linux) / Device Manager (Windows)
- [ ] Document: Manufacturer, device name, vendor ID, product ID
- [ ] Document typical inputs: kick pedal, 4 pads (red, yellow, blue, green), cymbal (optional)

### 1.2 Set Up Development Environment
- [ ] Ensure Node.js 18+ is installed
- [ ] Create project directory: `/Users/dbartosz/Projects/rockband-drums-midi`
- [ ] Initialize npm project with `npm init -y`
- [ ] Install runtime dependencies:
  - `node-hid` - read controller input via USB
  - `easymidi` - send MIDI messages to DAW
  - `dotenv` - environment configuration management
- [ ] Install dev dependencies:
  - `jest` - unit test runner
  - `jest-mock-extended` - advanced mocking utilities
- [ ] Create `jest.config.js` configuration file
- [ ] Add npm scripts:
  - `npm test` - run tests once
  - `npm run test:watch` - run tests in watch mode
  - `npm run test:coverage` - generate coverage report
  - `npm start` - start the controller

### 1.3 Set Up Virtual MIDI Port (Mac)
- [ ] Open **Audio MIDI Setup** (Applications > Utilities)
- [ ] Create Virtual MIDI Bus named "Rock Band Drums"
- [ ] This allows Node app to send MIDI to DAWs

---

## Phase 2: Hardware Detection & Input Mapping (Day 2)

### 2.1 Detect Controller Input
- [ ] Create `src/detect.js` - scan for Rock Band drums
- [ ] Log all detected game controllers
- [ ] Test each button/pad to map input codes
- [ ] Create mapping JSON file with vendor/product IDs

### 2.2 Create Input Mapper
- [ ] Create `src/mapper.js` - converts controller input → MIDI note numbers
- [ ] Map Rock Band pads to standard drum kit MIDI notes:
  - Red pad → Note 36 (Kick/Bass Drum) or 38 (Snare)
  - Yellow pad → Note 41 (Hi-Tom)
  - Blue pad → Note 48 (Hi-Tom/Mid-Tom)
  - Green pad → Note 45 (Low-Tom)
  - Kick pedal → Note 36 (Bass Drum)
  - Cymbal → Note 49 (Crash Cymbal 1)
- [ ] Create `config/drumMapping.json` for easy customization

---

## Phase 3: MIDI Output (Day 3)

### 3.1 Create MIDI Output Handler
- [ ] Create `src/midiOutput.js`
- [ ] Connect to "Rock Band Drums" virtual MIDI port
- [ ] Implement note-on/note-off messages
- [ ] Add velocity mapping (pressure sensitivity if available)

### 3.2 Create Main Controller Loop
- [ ] Create `src/controller.js` - main polling loop
- [ ] Read gamepad state at 60Hz
- [ ] Detect pad presses (state changes)
- [ ] Send MIDI notes with appropriate timing
- [ ] Handle simultaneous pad presses

---

## Phase 4: FL Studio Integration (Day 4)

### 4.1 Configure FL Studio
- [ ] Install FL Studio
- [ ] Open Settings > MIDI Settings
- [ ] Add "Rock Band Drums" as input device
- [ ] Map MIDI notes to drum samples/plugins

### 4.2 Test Scenarios
- [ ] Single pad hits
- [ ] Rapid hits on same pad
- [ ] Simultaneous multi-pad hits
- [ ] Velocity sensitivity (if applicable)

### 4.3 Create User Guide
- [ ] Document start/stop process
- [ ] Create `README.md` with setup instructions

---

## Phase 5: Cross-DAW Compatibility (Day 5)

### 5.1 Test with Ableton Live 12 Lite
- [ ] Configure Ableton to recognize "Rock Band Drums" MIDI
- [ ] Verify same MIDI mapping works
- [ ] No code changes needed (universal MIDI protocol)

### 5.2 Package for Portability
- [ ] Create `.env.example` for config
- [ ] Create `start.js` entry point
- [ ] Add npm scripts for easy launch
- [ ] Create installer/batch files for Windows
- [ ] Create shell script for Mac/Linux

---

## Phase 6: Enhancement & Polish

### Optional Features
- [ ] Adjustable note velocity mapping
- [ ] Profiles for different drum kits
- [ ] LED feedback (if drums support it)
- [ ] Latency monitoring/optimization
- [ ] GUI for configuration (Electron app)

---

## Technical Stack
- **Language**: Node.js (JavaScript)
- **Runtime**: Node.js 18+ (not Bun - native module compatibility)
- **Controller Input**: `node-hid` (USB HID device reading)
- **MIDI Output**: `easymidi` (platform-specific MIDI port access)
- **Config**: `dotenv` + JSON files for drum mappings
- **Testing Framework**: Jest + jest-mock-extended
- **Coverage Target**: 80%+ overall (100% mapper, 95% MIDI output, 85% detect, 80% controller loop)

---

## Testing Strategy (MVP - Unit Tests Only)

### Test Files & Coverage

**Phase 2: Mapper Tests** (`tests/mapper.test.js`)
- [ ] Pad → MIDI note conversion (red/yellow/blue/green/kick/cymbal)
- [ ] Invalid pad name error handling
- [ ] Velocity mapping logic
- [ ] Configuration loading and overrides
- **Coverage Goal**: 100% (critical path)

**Phase 2: Detection Tests** (`tests/detect.test.js`)
- [ ] Mock `node-hid.devices()` to return Harmonix PS3 drum kit (0x12ba:0x0210)
- [ ] Test identifying device by vendor/product ID match
- [ ] Test handling when device NOT detected
- [ ] Test HID device initialization errors
- [ ] Test filtering non-drum controllers (optional for MVP)
- **Coverage Goal**: 85%
- **Note**: Single device type simplifies logic (exact ID match, no version detection needed)

**Phase 3: MIDI Output Tests** (`tests/midiOutput.test.js`)
- [ ] Mock `easymidi.output()` port creation
- [ ] Test note-on message generation (correct note, velocity, channel)
- [ ] Test note-off message generation
- [ ] Test MIDI port connection/disconnection
- [ ] Test error handling on port creation failure
- **Coverage Goal**: 95%

**Phase 3: Controller Loop Tests** (`tests/controller.test.js`)
- [ ] Mock gamepad state with `jest.useFakeTimers()`
- [ ] Test single button press/release detection
- [ ] Test debouncing (prevent 50ms duplicate triggers)
- [ ] Test simultaneous multi-pad presses
- [ ] Test rapid successive presses (separate note-on/off events)
- [ ] Test 60Hz polling timing
- **Coverage Goal**: 80%

**Phase 2: Config Tests** (`tests/config.test.js`)
- [ ] Test loading `config/drumMapping.json`
- [ ] Test `.env` variable parsing
- [ ] Test default config fallback
- [ ] Test missing required config error
- [ ] Test environment variable overrides
- **Coverage Goal**: 90%

### Test Directory Structure
```
tests/
├── mapper.test.js
├── detect.test.js
├── midiOutput.test.js
├── controller.test.js
├── config.test.js
└── fixtures/
    ├── mockHIDDevices.js
    ├── mockControllerStates.js
    └── sampleConfigs.json
```

### Mocking Strategy
- **node-hid**: Mock device lists, HID class constructor, and read/write methods
- **easymidi**: Mock output port creation and send messages
- **Timers**: Use `jest.useFakeTimers()` for 60Hz polling tests
- **File system**: Mock config file loading (or use real fixture files)

### Why Unit Tests (Not Integration)?
1. **Fast feedback** - Tests run in <100ms, catch bugs immediately
2. **Isolated testing** - Mock DAW/MIDI port, test logic independently
3. **MVP focus** - Full DAW testing happens manually in FL Studio phase
4. **Reproducible** - No dependency on DAW state or MIDI drivers
5. **Maintainability** - Easy to update when hardware changes

---

## Why This Approach?
1. **No hardware modification needed** - Pure software solution
2. **Leverages your Node.js expertise** - Fullstack dev approach, faster iteration
3. **Truly portable** - Works across any DAW that accepts MIDI (FL Studio, Ableton, Studio One)
4. **Maintainable & scalable** - Easy to adjust mappings, add profiles, support new drum versions
5. **Unit tests catch bugs early** - 80%+ coverage prevents regressions before DAW testing
6. **No drivers needed** - Uses OS-level controller detection (HID)
7. **No dependency hell** - Minimal npm dependencies, works offline

## Timeline
- **Phase 1 (Setup + Tests)**: Day 1 + 0.3 days = ~1.3 days
- **Phase 2 (Detection + Mapper)**: Day 2 + 0.2 days = ~2.2 days
- **Phase 3 (MIDI Loop)**: Day 3 = 1 day
- **Phase 4 (FL Studio)**: Day 4 = 1 day
- **Phase 5 (Cross-DAW)**: Day 5 = 1 day
- **Total**: ~5.5 days part-time development
- **Complexity**: Medium (controller polling + MIDI basics)
- **Learning curve**: Low (you know Node.js, just learning MIDI protocol)
- **Unit test overhead**: ~10% of dev time, prevents ~70% of integration bugs

---

## Project Structure (After Phase 1.2)
```
rockband-drums-midi-controller/
├── src/
│   ├── detect.js          # Scan for Rock Band drums
│   ├── mapper.js          # Convert input → MIDI notes
│   ├── midiOutput.js      # Send MIDI messages
│   ├── controller.js      # Main polling loop
│   └── config.js          # Load configuration
├── config/
│   ├── drumMapping.json   # MIDI note mappings (customizable)
│   └── deviceIds.json     # Supported drum vendor/product IDs
├── tests/
│   ├── mapper.test.js
│   ├── detect.test.js
│   ├── midiOutput.test.js
│   ├── controller.test.js
│   ├── config.test.js
│   └── fixtures/
│       ├── mockHIDDevices.js
│       ├── mockControllerStates.js
│       └── sampleConfigs.json
├── .env.example           # Environment template
├── .gitignore
├── jest.config.js         # Test configuration
├── package.json
├── package-lock.json
├── start.js               # Main entry point
└── README.md              # Setup instructions
```

---

## Getting Started (Before Phase 1)

### 0.1 Identify Hardware
**✅ IDENTIFIED**: Harmonix Drum Kit for PlayStation 3
```
Device: Harmonix Drum Kit for PlayStation(R)3
Manufacturer: Licensed by Sony Computer Entertainment America
Vendor ID: 0x12ba (Sony Computer Entertainment America)
Product ID: 0x0210
Version: 10.00
Speed: Up to 12 Mb/s
Location ID: 0x02130000 / 11
Current Required (mA): 100
```

**Testing Scope:**
- **Single device type**: Harmonix PS3 Drum Kit (0x12ba:0x0210)
- **Testing environment**: Local macOS only
- **Future expansion**: Easy to add support for other drum versions (different vendor/product IDs)
- **Cross-platform DAW**: Code is portable to Windows/Linux (virtual MIDI setup differs)

**Hardware Characteristics (Research):**
- Harmonix PS3 drums use standard USB HID protocol
- Typical inputs: 4 pads (red, yellow, blue, green) + kick pedal + occasional cymbal pad
- HID data format: Will be discovered during Phase 2.1 (detect.js development)

### 0.2 Check Prerequisites
```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# If not installed:
# - Mac: brew install node
# - Or download from nodejs.org
```

### 0.3 Choose Approach (Already Decided)
✅ **Selected: Node.js MIDI Bridge Approach**
- Why: No hardware hacking, leverages your fullstack skills
- Alternative considered: Bun runtime → rejected (native module concerns)
- DAW choice: FL Studio for MVP (easier MIDI learn than Ableton)

---

## Implementation Strategy

### Single Device Scope (MVP Simplification)
- **Device**: Harmonix Drum Kit PS3 (0x12ba:0x0210)
- **Simplification**: No version detection needed - exact ID match
- **Testing**: Verified on one device type only (yours)
- **Future**: Adding new drum version = just add new vendor/product ID to config
- **Advantage**: Faster initial development (skip version abstraction)
- **Caveat**: Other drum users will need vendor/product ID mapping (easy to add later)
1. **Test infrastructure first** (Phase 1.2)
   - Jest config, mock utilities, test structure
   - Enables confident refactoring throughout

2. **Core logic before UI** (Phases 2-3)
   - Get detect.js + mapper.js working with tests
   - Get controller.js + midiOutput.js working
   - These are testable without DAW access

3. **Integration last** (Phases 4-5)
   - FL Studio configuration (easiest)
   - Manual testing in DAW (verify timing, responsiveness)
   - Cross-DAW verification (Ableton, Studio One)

### Dependency Notes
| Dependency | Why | Version |
|-----------|------|---------|
| `node-hid` | Read USB controller input (required) | Latest |
| `easymidi` | Send MIDI to virtual port (required) | Latest |
| `dotenv` | Load config from .env file (optional but recommended) | Latest |
| `jest` | Unit testing (development only) | ^29.0.0 |
| `jest-mock-extended` | Advanced mocking (development only) | Latest |

### Known Challenges & Solutions

**Challenge 1: node-hid Native Modules**
- Problem: Requires C++ compilation on install
- Solution: May need Xcode Command Line Tools on macOS
- Mitigation: `npm install --build-from-source` if auto-build fails

**Challenge 2: Rock Band Drums HID Input Format**
- Problem: Need to discover actual HID input byte format for this device
- Solution: Run detect.js + log raw HID data during Phase 2.1
- Research: Harmonix PS3 drums likely use standard format (4 pads + pedal + cymbal)
- Mitigation: Create `tests/fixtures/mockHIDDevices.js` once we map actual byte sequences

**Challenge 3: MIDI Timing Precision**
- Problem: 60Hz polling may miss very quick taps
- Solution: Use debouncing (50ms window) + velocity in MIDI notes
- Acceptable: Good enough for FL Studio/Ableton (they also have latency)

**Challenge 4: Virtual MIDI Bus on Different OSes**
- Mac: Audio MIDI Setup (built-in)
- Windows: Install LoopMIDI or VB-Audio Virtual MIDI Cable
- Linux: timidity or qjackctl creates virtual ports automatically
- Solution: Document for each OS in README.md (Phase 4.3)

---

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| **Node.js + JavaScript** | Fullstack expertise, npm ecosystem strength | Python, C++, Rust |
| **Reject Bun** | Native modules less stable, no performance gain | Bun runtime |
| **Start with FL Studio** | Simpler MIDI learn interface | Ableton Live 12 Lite |
| **Unit tests (MVP)** | Fast feedback, no DAW dependencies | Integration tests first |
| **Virtual MIDI bus** | No extra hardware, universal DAW support | USB passthrough, dedicated hardware |
| **JSON config files** | Human-readable, versioned with git | Database, environment variables |
| **60Hz polling** | Matches display refresh, good balance | Higher (battery drain) / Lower (missed inputs) |

---

## Next Steps

### Immediate (Today - DONE ✅)
- [x] Plug in Rock Band drums and identify hardware
- [x] Document vendor ID (0x12ba), product ID (0x0210)
- [x] Verify device type: Harmonix Drum Kit PS3

### Phase 1 Start (Day 1)
- [ ] Create GitHub repo in `/Users/dbartosz/Projects/rockband-drums-midi`
- [ ] Run `npm init -y` and install dependencies
- [ ] Create `jest.config.js` and verify `npm test` runs
- [ ] Create dummy test file to confirm Jest works
- [ ] Create `config/deviceIds.json` with known IDs:
  ```json
  {
    "devices": [
      {
        "name": "Harmonix Drum Kit PS3",
        "vendorId": 0x12ba,
        "productId": 0x0210
      }
    ]
  }
  ```
- [ ] Create `config/drumMapping.json` with default MIDI notes (drum kit standard)
- [ ] Set up virtual MIDI port on macOS (Audio MIDI Setup)

### Phase 2 Start (Day 2)
- [ ] Write `src/detect.js` to find device by 0x12ba:0x0210
- [ ] **CRITICAL**: Log raw HID data to discover input format
  - Test: Press each pad individually, log received bytes
  - Document: Which bytes correspond to red/yellow/blue/green/kick/cymbal
  - Create: `tests/fixtures/mockHIDDevices.js` with discovered byte sequences
- [ ] Write tests for detect.js with mock device data
- [ ] Write `src/mapper.js` with discovered HID byte → MIDI note mapping

### After Phase 1
- [ ] Proceed with Phase 3: MIDI Output
- [ ] Write tests as you write code (TDD mindset)
- [ ] Keep this PLAN.md updated as you discover HID format

---

## Resources
- [node-hid GitHub](https://github.com/node-hid/node-hid) - Controller input library
- [easymidi GitHub](https://github.com/Rodrigo-Barros/easymidi) - MIDI sending library
- [MIDI Note Numbers](https://en.wikipedia.org/wiki/Scientific_pitch_notation#MIDI_note_numbers) - Reference for drum kit mapping
- [FL Studio MIDI Learning](https://www.image-line.com/fl-studio-learning/) - DAW setup docs
- [Rock Band Drum Specs](https://en.wikipedia.org/wiki/Rock_Band) - Hardware background
