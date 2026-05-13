# Rock Band Drums + FL Studio Integration Guide

This guide walks through connecting your Rock Band drums MIDI controller to FL Studio and mapping the pads to instruments.

## Prerequisites

- FL Studio installed (v20 or newer recommended)
- Rock Band drums connected and generating MIDI data (pads correctly detected)
- Your MIDI application/driver running that passes Rock Band MIDI through

## Part 1: Configuring MIDI Input in FL Studio

### Step 1.1: Open MIDI Settings
1. Launch FL Studio
2. Go to **Options > MIDI settings** (or press **F10**)
3. The MIDI settings panel will open

### Step 1.2: Enable Your MIDI Device
1. In the MIDI settings dialog, find the **Input** section
2. Look for your Rock Band drums controller in the device list
3. Click the **Enable** button next to it (you should see the MIDI activity light blink on the Main Panel when data is received)
4. If your device doesn't appear:
   - Click **Refresh device list** to rescan connected devices
   - Check that your MIDI application/driver is running
   - Verify the drums are powered on and connected

### Step 1.3: Configure MIDI Input Options
1. **Enable Pickup Mode (Takeover)** - Recommended for drum controllers
   - Prevents unexpected parameter jumps when linking pads to instruments
   - Linked parameters won't change until the physical pad value matches

2. **Enable Auto Accept Controller** - Optional but recommended
   - Automatically closes the MIDI Remote Control dialog after linking
   - Speeds up the linking workflow

3. **Set Velocity Mapping** if needed
   - Rock Band drums send velocity data (harder hits = higher velocity)
   - Leave default unless you want custom velocity response curves

4. Click **OK** to save settings

---

## Part 2: Mapping Rock Band Pads to FL Studio Drums/Instruments

There are two approaches depending on your setup:

### Approach A: Simple Drum Kit (Single Channel Mapping)

Use this if you want each drum pad to trigger a specific drum sound.

#### Step 2A.1: Set Up Your Drum Instrument
1. In the **Step Sequencer** or **Piano Roll**, create a new channel
2. Load a drum instrument:
   - **Native:** Drag a drum sample or instrument from the browser
   - **Plugin:** Load your favorite drum VST/AU (e.g., Serum, Sytrus, or a drum plugin)
3. Position this channel as your "Drum Kit" track

#### Step 2A.2: Link Pads to Drum Sounds (For FL Studio Native Instruments)
1. **Right-click** on a drum sound/pad in the instrument
2. Select **"Link to Controller"**
3. A "MIDI Remote Control" dialog appears
4. **Hit the corresponding drum pad** on your Rock Band controller
5. The dialog closes automatically (if Auto Accept is enabled) or you click **OK**
6. **Repeat for each pad:**
   - Kick drum pad → Link to bass drum sound
   - Snare pad → Link to snare sound
   - Tom 1 pad → Link to high tom
   - Tom 2 pad → Link to mid tom
   - Cymbal pad → Link to crash/ride cymbal

**Visual Check:** When you hit a drum pad and the mapped instrument lights up/responds, the link is working.

#### Step 2A.3: Link Pads to VST/AU Plugin Parameters (Advanced)
For drum plugins where right-click linking doesn't work:

1. Open the plugin editor window
2. Press **Ctrl+J** (or **Cmd+J** on Mac) to activate **Multilink mode**
3. In the FL Studio window, **hit the drum pad** you want to map
4. The "Last Tweaked Control" in the plugin will be selected
5. **Move a parameter in the plugin** (e.g., turn a knob) with your mouse
6. **Now move your Rock Band drum pad** to complete the mapping
7. Repeat for each parameter/pad combination

---

### Approach B: Advanced Automation (Multiple Channels/Dynamic Control)

Use this if you want drum pads to control multiple instruments or parameters simultaneously.

#### Step 2B.1: Create Multiple Instrument Channels
1. Create separate channels for different drum sounds or musical elements
2. Example setup:
   - Channel 1: Bass drum (Kick)
   - Channel 2: Snare
   - Channel 3: Toms (with automation)
   - Channel 4: Cymbals/Crash
   - Channel 5: Melodic element controlled by velocity/pad combination

#### Step 2B.2: Map Pads to Individual Channel Parameters
For each channel:

1. **Click the target channel** to select it
2. **Right-click any parameter** you want the pad to control (volume, pitch, filter, etc.)
3. Select **"Link to Controller"**
4. **Move the corresponding pad** on your Rock Band drums
5. **Customize the mapping:**
   - After linking, right-click the linked parameter again
   - Select **"MIDI Remote Control Settings"**
   - Configure:
     - **Mapping Mode:** Linear (default), Inverted, Logarithmic, or Switch
     - **Smoothing:** Add smoothing to eliminate abrupt changes (set to 10-50 ms)
     - **Custom Formula:** Use `Input*2` to double sensitivity, or other expressions

#### Step 2B.3: Set Up Velocity-Based Dynamics
Rock Band pads send velocity data (how hard you hit = higher velocity value):

1. Link a pad's **velocity** to a parameter:
   - Right-click a knob/slider you want velocity to control (e.g., volume, filter brightness)
   - Link to the same pad but configure it in **MIDI Remote Control Settings** as **Velocity mode**
2. Now hitting the pad harder = increased parameter value

---

## Part 3: Testing and Fine-Tuning

### Step 3.1: Test Each Pad
1. With MIDI settings open, **hit each drum pad**
2. Verify the **MIDI activity light** blinks for each pad
3. Check that the correct drum sounds trigger

### Step 3.2: Adjust Sensitivity
If pads are too sensitive or not sensitive enough:

1. Right-click the linked parameter
2. **"MIDI Remote Control Settings"**
3. Adjust:
   - **Minimum/Maximum values** to restrict the parameter range
   - **Smoothing** (in milliseconds) to filter jitter
   - **Custom formula** like `Input * 0.5` to reduce sensitivity by half

### Step 3.3: Verify Pickup Mode
1. Set a parameter (e.g., volume) to minimum
2. Hit the corresponding pad gently (should match parameter value first)
3. Only after matching should the parameter jump
4. This prevents accidental loud blasts from pad hits

---

## Part 4: Recording and Playback

### Step 4.1: Enable Recording
1. Press **Spacebar** to start recording
2. Hit your drum pads—FL Studio captures the MIDI data
3. Press **Spacebar** again to stop

### Step 4.2: View Recorded Automation
1. Open the **Piano Roll** or **Step Sequencer**
2. Your pad hits appear as MIDI notes with velocity data
3. Edit timing or velocity if needed

### Step 4.3: Fine-Tune Performance
- Use **Quantize** to snap hits to the beat grid if needed
- Adjust velocities in the Piano Roll for consistent dynamics
- Layer additional instruments or automation tracks

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MIDI device not appearing | Restart FL Studio, check device is powered on, use **Refresh device list** in MIDI settings |
| Pads not triggering sounds | Verify MIDI activity light blinks in MIDI settings; check that the link was created (right-click parameter shows it's linked) |
| Parameters jumping unexpectedly | Enable **Pickup Mode** in MIDI settings |
| Velocity not working | Some plugins may not respond to velocity; try a different instrument or adjust the velocity mapping formula |
| Latency/delay between pad and sound | Reduce **buffer size** in Options > Audio settings for lower latency |
| Link lost after closing project | Ensure you're using **Project-Level Links** (right-click > "Link to Controller") which persist when you reopen |

---

## Key FL Studio MIDI Concepts

**Project-Level Links** (Recommended)
- Saved per-project
- Highest priority
- Persist when you reopen the project
- Work even when other plugins are focused
- Method: Right-click parameter → "Link to Controller"

**Global Links**
- Apply across all projects (unless overridden)
- Useful for standardizing workflow
- Automatically re-establish when switching windows

**Mapping Modes** (in MIDI Remote Control Settings)
- **Linear:** Standard 1:1 mapping (default)
- **Inverted:** Reverse the mapping (low input = high output)
- **Logarithmic:** Better for frequency/pitch controls
- **Switch:** Binary on/off (useful for toggling features)

---

## Next Steps

1. **Test basic mapping:** Map kick drum → bass drum sound
2. **Expand:** Add snare, toms, cymbals
3. **Automate:** Use velocity to control volume/brightness
4. **Refine:** Adjust smoothing and sensitivity for real-time performance
5. **Create patterns:** Record and layer multiple takes for a full drum arrangement

Good luck! Your Rock Band drums are now ready to produce music in FL Studio.
