# Velocity/Pressure Diagnostics Guide

## Overview

This guide explains how to check if your Rock Band drum kit actually sends velocity/pressure data in the HID protocol, and identify which bytes (if any) contain that information.

## Why This Matters

Many drum controllers report **pad identity** (which pad was hit) but don't report **strike intensity** (how hard it was hit). The controller has a `USE_PRESSURE_VELOCITY` setting that should theoretically read pressure data, but if the hardware doesn't send it, you'll get the same velocity for soft and hard strikes.

This tool helps you determine:
- ✅ Does my hardware send pressure/velocity data?
- ✅ Which HID byte(s) contain it?
- ✅ What is the range (0-255, 0-127, etc)?
- ✅ How does it correlate with strike intensity?

## Quick Start

### 1. Start the Controller with Diagnostics Enabled

```javascript
const controller = require('./src/controller');

// Find your drum kit
const device = await detect.findDrumKit();

// Start the controller
await controller.start(device);

// Let it run for 30+ seconds while you play the drums
// (especially try different strike intensities)
```

### 2. Generate Diagnostic Reports

After 30+ pad presses:

```javascript
// Show raw HID data from last 10 presses
controller.reportHidDiagnostics();

// This outputs:
// - Raw byte values for each press
// - Which bytes vary and which are constant
// - Statistics per-pad
```

### 3. Measure Velocity Correlation (Optional but Recommended)

For best results, create a specific test:

1. **Press RED pad GENTLY** (weak strike)
2. **Press RED pad HARD** (strong strike, max force)
3. Run:

```javascript
controller.measureVelocity();
```

This compares the two presses and shows which bytes changed.

## Interpreting Results

### Output Example 1: Hardware Supports Pressure

```
🔍 LOOKING FOR PRESSURE/VELOCITY BYTES
=============================================================================

Bytes with varying values (candidates for velocity/pressure):

  Byte[1]: 5 unique values
    Range: 50 → 150
    Sample: [50, 75, 100, 125, 150]

  Byte[7]: 8 unique values
    Range: 40 → 180
    Sample: [40, 60, 80, 100, 120, 140, 160, 180]
```

**Interpretation**: ✅ Your hardware DOES send pressure!
- Byte[1] or Byte[7] (or both) contain pressure/velocity
- Values range 40-180, so scale to 0-255 or 0-127 as needed
- Configure `USE_PRESSURE_VELOCITY=true` in `.env`

### Output Example 2: Hardware Does NOT Support Pressure

```
🔍 LOOKING FOR PRESSURE/VELOCITY BYTES
=============================================================================

Bytes with varying values (candidates for velocity/pressure):

❌ NO VARYING BYTES FOUND - Hardware may not report velocity/pressure
```

**Interpretation**: ❌ Your hardware does NOT send pressure
- All bytes are constant across presses
- `USE_PRESSURE_VELOCITY=true` will have no effect
- Velocity will always be `DEFAULT_VELOCITY` (set in `.env`)
- Consider using time-since-last-press as a proxy for intensity

## Known Hardware

| Device | Velocity Support | Notes |
|--------|-----------------|-------|
| Harmonix PS3 Drums | ❓ Unknown | **This is what we're testing** |
| Mad Catz Drum Controller | ❓ Unknown | Need testing data |
| Generic USB Drums | ❓ Unknown | Varies widely |

**If you test your hardware, please report findings!**

## HID Byte Reference

The controller records all 27 bytes of HID data. Here's what we know:

| Byte(s) | Purpose | Notes |
|---------|---------|-------|
| [0] | Pad identity | Bitmask: 1=blue, 2=green, 4=red, 8=yellow, 16=kick |
| [1] | Unknown | Varies by hardware, might be velocity |
| [2] | Blue X (stuck) | Always 8, ignore |
| [3-6] | Axis data | Pressure/calibration, usually 128, might vary |
| [7] | Unknown | Varies by hardware, might be velocity |
| [8-19] | Unused | Usually 0 |
| [20-26] | Baseline states | Usually 2, ignore |

## Detailed API

### `reportHidDiagnostics()`

```javascript
controller.reportHidDiagnostics();
```

Outputs:
- **RAW HID DATA REPORT**: Last 10 pad presses with all byte values
- **PRESSURE/VELOCITY BYTES**: Which bytes vary and how much
- **PER-PAD BYTE ANALYSIS**: Statistics (min/max/avg) for each byte per pad

### `measureVelocity()`

```javascript
controller.measureVelocity();
```

Outputs byte differences between the last weak press and the last hard press.

**Best practice**:
1. Make sure controller has run 2+ seconds
2. Press once softly, note the count
3. Press once hard
4. Call `measureVelocity()`

### `getHidMeasurementCount()`

```javascript
const count = controller.getHidMeasurementCount();
console.log(`Recorded ${count} pad presses`);
```

Returns the number of pad presses recorded since startup.

### `resetHidDiagnostics()`

```javascript
controller.resetHidDiagnostics();
```

Clears all recorded measurements. Useful before starting a fresh test.

## Step-by-Step Testing Procedure

### Test 1: Basic Raw Data Inspection (5 minutes)

```javascript
// 1. Start controller
const device = await detect.findDrumKit();
await controller.start(device);

// 2. Play drums for 30 seconds, varying intensity
//    (hit each pad soft, medium, hard several times)

// 3. Report raw data
controller.reportHidDiagnostics();

// 4. Check: Does any byte vary?
//    If all bytes constant → hardware doesn't report velocity
//    If some bytes vary → potential velocity bytes found
```

### Test 2: Pressure Correlation (10 minutes)

```javascript
// 1. Clear old data
controller.resetHidDiagnostics();

// 2. Press RED pad GENTLY (one soft tap)
// 3. Wait 3 seconds
// 4. Press RED pad HARD (full force)

// 5. Compare
controller.measureVelocity();

// 6. Check output:
//    If bytes changed → pressure is reportable
//    If no bytes changed → hardware doesn't differentiate intensity
```

### Test 3: Per-Pad Analysis (5 minutes)

```javascript
// 1. Clear data
controller.resetHidDiagnostics();

// 2. Test EACH pad individually:
//    - Red, soft and hard
//    - Yellow, soft and hard
//    - Blue, soft and hard
//    - Green, soft and hard
//    - Kick, soft and hard

// 3. Analyze
controller.reportHidDiagnostics();

// 4. Check: Do different pads affect different bytes?
//    This helps isolate which byte(s) represent velocity
```

## What to Do With Results

### If Pressure IS Supported

Update `.env`:
```bash
USE_PRESSURE_VELOCITY=true
DEFAULT_VELOCITY=50  # Falls back for this value if no pressure
```

Then update `src/mapper.js` `getVelocity()` to read from the correct byte(s):
```javascript
// Currently assumes a single velocity byte, but you may need:
// byte[1] for velocity, byte[7] for another parameter, etc.
```

### If Pressure is NOT Supported

Leave `.env` as:
```bash
USE_PRESSURE_VELOCITY=false
DEFAULT_VELOCITY=100
```

All presses will send the same velocity (100), which is fine for basic drumming.

## Troubleshooting

### "No varying bytes found" but I expect pressure

Possible causes:
- Controller not detecting presses correctly → check `reportHidDiagnostics()` output for non-zero bytes
- Striking too lightly to register → try full force
- Hardware really doesn't support it → proceed with constant velocity

### Different pads show different pressure ranges

This is normal. Pads at different physical positions on the kit may have different sensor ranges. The scaling code in `mapper.getVelocity()` should normalize (0-255 → 10-127 MIDI range).

### Bytes vary wildly, seems like noise

Some variance from sensor noise is expected. If the range is > 100 units difference between soft/hard strikes, it's real pressure data. If it's < 10 units, it's probably noise.

## Files

| File | Purpose |
|------|---------|
| `src/hidDiagnostics.js` | Core analysis library |
| `src/controller.js` | Integration (calls hidDiagnostics) |
| `tests/hidDiagnostics.test.js` | Unit tests (131 total) |
| `VELOCITY_DIAGNOSTICS.md` | This guide |

## Contributing Results

If you test your hardware:

1. Note the **device model** and **USB vendor/product IDs**
2. Run the three tests above
3. Share the output of `reportHidDiagnostics()`
4. Create an issue or PR to add your findings to the `KNOWN HARDWARE` table

Example report:
```
Device: Harmonix Rock Band Drums (PS3)
Vendor ID: 0x12BA, Product ID: 0x0210

Result: Pressure supported in Byte[7]
Range: 40-180 (scale to 0-127 MIDI range)
Test Duration: 50 presses over 2 minutes
Notes: Correlates well with strike intensity
```

## See Also

- [LATENCY_GUIDE.md](LATENCY_GUIDE.md) — Measuring input lag
- [MULTI_PAD_SUPPORT.md](MULTI_PAD_SUPPORT.md) — Simultaneous presses
- `.env` — Configuration (USE_PRESSURE_VELOCITY, DEFAULT_VELOCITY)
- `src/mapper.js` — Where velocity is calculated
