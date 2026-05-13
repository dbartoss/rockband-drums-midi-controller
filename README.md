# Rock Band Drums MIDI Controller

Convert your Harmonix Drum Kit (PlayStation 3) into a universal MIDI controller for FL Studio, Ableton Live, Studio One, and more.

## Features

- ✅ USB HID controller input reading
- ✅ MIDI note output to DAWs
- ✅ Configurable drum pad mappings
- ✅ Cross-platform support (macOS, Windows, Linux)
- ✅ Unit tested (80%+ coverage)

## Prerequisites

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **Harmonix Drum Kit PS3** with USB connection
- **macOS**: Audio MIDI Setup (built-in)
- **Windows**: LoopMIDI or VB-Audio Virtual MIDI Cable
- **Linux**: JACK or timidity

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Virtual MIDI Port (macOS Only)

1. Open **Audio MIDI Setup** (Applications → Utilities)
2. Click **Window** → **Show MIDI Studio** (if not visible)
3. Double-click **IAC Driver**
4. Click **+** to add a port
5. Name it: `Rock Band Drums`
6. Close the window

### 3. Create .env File

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults should work):

```env
MIDI_PORT_NAME=Rock Band Drums
POLL_RATE_HZ=60
DEBUG=false
```

### 4. Run the Controller

```bash
npm start
```

Expected output:
```
🥁 Rock Band Drums MIDI Controller v0.1.0
============================================

📡 Scanning for Harmonix Drum Kit PS3...
✅ Found: Harmonix Drum Kit for PlayStation(R)3
   Vendor: 0x12ba
   Product: 0x0210

🎵 Starting MIDI controller...
✅ Controller running. Press Ctrl+C to stop.
```

## Testing

Run unit tests:

```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Configuration

### Drum Pad Mappings

Edit `config/drumMapping.json` to customize MIDI note mappings:

```json
{
  "pads": {
    "red": { "midiNote": 36, "name": "Bass Drum" },
    "yellow": { "midiNote": 41, "name": "Low Tom" },
    "blue": { "midiNote": 48, "name": "High Tom" },
    "green": { "midiNote": 45, "name": "Low-Mid Tom" },
    "kick": { "midiNote": 36, "name": "Kick Pedal" },
    "cymbal": { "midiNote": 49, "name": "Crash Cymbal" }
  }
}
```

### Supported Devices

See `config/deviceIds.json` for supported drum controllers. To add new devices:

1. Identify vendor/product ID (see HARDWARE_DISCOVERY.md)
2. Add entry to `config/deviceIds.json`
3. Create test fixtures if needed

## DAW Configuration

### FL Studio

1. Open **Settings** → **Input/Output**
2. Under **MIDI**, select **Rock Band Drums** as input
3. In Step Sequencer, select drums for each note

### Ableton Live

1. Open **Preferences** → **Link, Tempo, MIDI**
2. Under **MIDI Ports**, enable **Rock Band Drums**
3. Map pads in your drum rack

### Studio One

1. Open **Studio One** → **Preferences** → **I/O Setup**
2. Under **MIDI**, select **Rock Band Drums** input
3. Configure in External Device panel

## Troubleshooting

### Device Not Found

- Ensure Harmonix Drum Kit is connected via USB
- Run: `system_profiler SPUSBDataType | grep -i harmonix` (macOS)
- Verify it shows: `Vendor ID: 0x12ba` and `Product ID: 0x0210`

### No MIDI Output

- Verify virtual MIDI port exists
- Check port name matches `.env` (`MIDI_PORT_NAME`)
- Run: `npm run test` to verify mapper logic

### Xcode Command Line Tools Error

macOS only - required for native modules:

```bash
xcode-select --install
npm install --build-from-source
```

## Development

### Project Structure

```
src/
  ├── detect.js       # Find and connect to device
  ├── mapper.js       # HID bytes → MIDI notes
  ├── midiOutput.js   # Send MIDI messages
  ├── controller.js   # Main polling loop
  └── config.js       # Load configuration

tests/
  ├── mapper.test.js
  ├── detect.test.js
  ├── midiOutput.test.js
  ├── controller.test.js
  ├── config.test.js
  └── fixtures/       # Mock data

config/
  ├── deviceIds.json
  └── drumMapping.json
```

### Phase Reference

See [PLAN.md](./PLAN.md) for full implementation roadmap.

## License

MIT
