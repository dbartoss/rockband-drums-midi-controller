# Quick Velocity Testing Guide

## The Problem

You noticed that even with `USE_PRESSURE_VELOCITY=true`, all pad strikes produce the same MIDI velocity. This could mean:

1. ✅ Your hardware DOES send pressure data, but we're reading the wrong byte
2. ❌ Your hardware does NOT send pressure data at all
3. ⚠️  The pressure range is too small to notice

This guide helps you determine which case applies.

## Quick Test (2 minutes)

### Step 1: Start Controller with Diagnostics

```bash
# In Node.js / your application:
const controller = require('./src/controller');
const device = await detect.findDrumKit();
await controller.start(device);
```

### Step 2: Play Drums (30 seconds)

Hit each pad multiple times, varying the strike intensity:
- Soft taps
- Normal hits
- Hard strikes (full force)

Try to get at least 5-10 hits per pad at different intensities.

### Step 3: Generate Report

```javascript
controller.reportHidDiagnostics();
```

## Reading the Report

### Section 1: Raw HID Data

Shows the last 10 pad presses with all byte values.

**Look for**: Are any bytes different across presses?

Example (varies):
```
Press #1 - red
  Byte[0]: 4
  Non-zero bytes:
    [0] = 4
    [7] = 50         ← This byte varies!
```

Example (constant):
```
Press #1 - red
  Byte[0]: 4
  Non-zero bytes:
    [0] = 4
    [7] = 100        ← Same every time
```

### Section 2: Pressure/Velocity Bytes

Lists which bytes have varying values across all presses.

**If you see this** → 🟢 Hardware likely sends pressure
```
Bytes with varying values:

  Byte[7]: 8 unique values
    Range: 40 → 180
    Sample: [40, 60, 80, 100, 120, 140, 160, 180]
```

**If you see this** → 🔴 Hardware probably doesn't send pressure
```
❌ NO VARYING BYTES FOUND - Hardware may not report velocity/pressure
```

### Section 3: Per-Pad Statistics

Shows min/max/average for each byte per pad.

**Good sign** (varies by pad):
```
RED
   Presses recorded: 5
   Bytes that carry data:

   Byte[7]:
     Min:      40
     Max:      180
     Avg:      110.0
     Variance: 140 (🟢 VARIES)
```

**Bad sign** (constant):
```
RED
   Bytes that carry data:

   Byte[7]:
     Min:      100
     Max:      100
     Avg:      100.0
     Variance: 0 (🔴 CONSTANT)
```

## Next Steps

### If Pressure IS Supported ✅

Great! Your hardware has it. Now we need to:

1. **Identify the correct byte(s)** — Note which byte varies (probably [1], [3-6], or [7])
2. **Update the code** — Modify `src/mapper.js` to read from that byte
3. **Test velocity range** — Ensure it maps correctly to MIDI 10-127

Currently `mapper.getVelocity()` uses `byte0` as a proxy. You'll need to modify it to read from the pressure byte instead.

### If Pressure is NOT Supported ❌

No problem! Your hardware just doesn't measure strike intensity.

1. Keep `USE_PRESSURE_VELOCITY=false` in `.env`
2. All presses will use `DEFAULT_VELOCITY=100`
3. This is fine for most drumming; you'll just get uniform volume

## Advanced: Measure Weak vs Hard

For a more precise test:

```javascript
// 1. Clear previous data
controller.resetHidDiagnostics();

// 2. Press RED SOFTLY once
// 3. Wait 3 seconds
// 4. Press RED HARD once

// 5. Compare
controller.measureVelocity();
```

This shows exactly which bytes changed between the two strikes.

## Still Stuck?

Check these things:

1. **Presses aren't registering** → Look at `reportHidDiagnostics()` — does byte[0] show non-zero?
2. **All bytes are 0** → Device isn't being read, check `DEBUG=true` in `.env` and look for HID read errors
3. **Some bytes vary slightly (10-20 units)** → Could be noise OR real pressure with small range — try a full-force test
4. **Many bytes vary wildly** → Your sensor setup might have noise issues or USB power problems

## Files for Reference

- `src/hidDiagnostics.js` — The analysis engine
- `src/controller.js` — Integration (reportHidDiagnostics, measureVelocity, etc.)
- `src/mapper.js` → getVelocity() — Where velocity is currently calculated
- `VELOCITY_DIAGNOSTICS.md` — Detailed guide with examples

## Summary

| Finding | Meaning | Action |
|---------|---------|--------|
| Bytes vary 0-255 | Hardware supports pressure ✅ | Identify byte, update mapper code |
| Bytes vary 40-180 | Hardware supports pressure ✅ | Identify byte, update mapper code |
| No varying bytes | Hardware doesn't support ❌ | Use constant velocity |
| Bytes vary 5-15 units | Probably noise, test harder ⚠️ | Full-force test, check cables |

Good luck! 🎵
