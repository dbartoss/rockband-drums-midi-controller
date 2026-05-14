# Drum Mapping Configuration

## Overview

The Rock Band drum controller has 4 colored pads that need to map to MIDI drum sounds. There are two valid approaches:

1. **Game-Based Mapping** (Current) — Mimics the actual Rock Band game layout
2. **Realistic Mapping** (Recommended) — Based on real drum kit ergonomics

## Current Mapping: Game-Based

This mapping mimics how Rock Band games assign pad colors to sounds, which does NOT match real drum kit ergonomics.

| Pad | Color | HID Bit | Current Sound | MIDI Note | Game Context |
|-----|-------|---------|---------------|-----------|--------------|
| Top-Left | Red | 4 | 🥁 Snare Drum | 38 | Rock Band standard |
| Top-Right | Yellow | 8 | 🎵 Closed Hi-Hat | 42 | Rock Band standard |
| Bottom-Left | Blue | 1 | 🎼 Tom-Tom (High) | 48 | Rock Band standard |
| Bottom-Right | Green | 2 | 💥 Crash Cymbal | 49 | Rock Band standard |
| Pedal | Orange | 16 | 🔊 Bass Drum/Kick | 36 | Standard drum kit |

**Issue**: The Game-Based mapping is intuitive for Rock Band game players but feels awkward for actual drumming because:
- Hi-hat (yellow) is in the top-right, but drummers expect it on the left
- Snare (red) is in the top-left, but drummers expect it in the center-right
- Tom (blue) is bottom-left, but drummers expect snare there
- Crash (green) is bottom-right, which is closer to correct but still not ideal

---

## New Mapping: Realistic (Recommended)

This mapping aligns pad positions with a real drum kit layout:

```
Real Drum Kit Layout (Drummer's View):
─────────────────────────────────────

        Kick Drum
           (Pedal)
              ↓
    
    Hi-Hat ←──→ Snare
    (Left)      (Right)

    Tom/Ride ←→ Crash/Floor
    (Left-Low)  (Right-Low)
```

Updated mapping to match real drums:

| Pad | Color | HID Bit | New Sound | MIDI Note | Real Kit Position |
|-----|-------|---------|-----------|-----------|-------------------|
| Top-Left | Red | 4 | 🎵 Closed Hi-Hat | 42 | Drummer's left (hi-hat pedal area) |
| Top-Right | Yellow | 8 | 🎼 Tom (Small/Crash Cymbal) | 45 | Drummer's right-up (small tom) |
| Bottom-Left | Blue | 1 | 🥁 Snare Drum | 38 | Center-low (snare position) |
| Bottom-Right | Green | 2 | 💥 Ride/Floor Tom | 49 | Drummer's right-low (floor tom/ride cymbal) |
| Pedal | Orange | 16 | 🔊 Bass Drum/Kick | 36 | Below kick pedal |

**Advantages**:
- Top-left (hi-hat) matches left-hand cymbals in real kit
- Top-right (small tom) matches right-hand tom in real kit
- Bottom-left (snare) matches snare position (center-low)
- Bottom-right (ride/floor) matches right-low cymbal/tom area
- Feels natural for anyone with real drumming experience

---

## How to Switch

### To Use Realistic Mapping (Recommended)

1. Replace `config/drumMapping.json` with the realistic mappings
2. No code changes needed — mapper automatically reads from config
3. Test with `npm test` — all tests verify the mapping works

### To Keep Game-Based Mapping

1. Keep current `config/drumMapping.json`
2. Document why (e.g., familiar to Rock Band players)
3. Accept awkward ergonomics for actual drumming

---

## MIDI Notes Reference

Common General MIDI drum kit (Channel 10) assignments:

| Note | Name | Purpose | Usage |
|------|------|---------|-------|
| 36 | Bass Drum | Kick/Pedal | Primary bass drum |
| 38 | Acoustic Snare | Snare | Center drum |
| 42 | Closed Hi-Hat | Hi-Hat | Left cymbal (closed) |
| 45 | Low Tom | Tom | Left tom |
| 46 | Open Hi-Hat | Hi-Hat | Left cymbal (open) |
| 47 | Low-Mid Tom | Tom | Center tom |
| 48 | High Tom / Tom-Tom | Tom | Right tom (high) |
| 49 | Crash Cymbal 1 | Crash | Right cymbal (crash) |
| 51 | Ride Cymbal | Ride | Right cymbal (ride) |
| 52 | Chinese Cymbal | Cymbal | Alternate crash |

---

## File Structure

```
config/
└── drumMapping.json          ← Update this to switch mappings
    
src/
├── mapper.js                 ← Reads drumMapping.json (no change needed)
├── controller.js             ← Uses mapper.mapPadToNote() (no change)
└── config.js                 ← Loads drumMapping.json (no change)

tests/
└── mapper.test.js            ← Verify mapping works (update expected notes)
```

---

## Update Checklist

If switching to Realistic Mapping:

- [ ] Update `config/drumMapping.json` with new MIDI notes
- [ ] Run `npm test` to verify all tests pass
- [ ] Update test expectations if notes changed
- [ ] Test actual MIDI output to DAW/FL Studio
- [ ] Document why you chose this mapping (for future reference)

If staying with Game-Based Mapping:

- [ ] Document this choice in project notes
- [ ] Add comment to `config/drumMapping.json` explaining this is intentional
- [ ] Inform users of the ergonomic trade-off

---

## Background: Why Game-Based Mapping Exists

Rock Band games assigned colors arbitrarily for gameplay purposes, not drum realism:
- Game designers wanted clear visual hierarchy
- Color associations helped players learn quickly
- Realistic positioning wasn't a goal for console games

But for actual drum practice/recording:
- Real drumming positions matter for muscle memory
- Ergonomics affect playing comfort
- FL Studio and real drums expect conventional kit layout

---

## See Also

- `drumMapping.json` — The configuration file
- `src/mapper.js` — How pad colors map to MIDI notes
- `tests/mapper.test.js` — Test coverage for all mappings
- `MULTI_PAD_SUPPORT.md` — Simultaneous pad handling
- `VELOCITY_DIAGNOSTICS.md` — Measuring strike intensity
