# Latency Measurement Guide

## Overview

The latency monitoring system measures the time taken for signals to pass through different stages of the MIDI pipeline. This helps identify where delays occur between physical pad presses and FL Studio sound output.

## Architecture

### Measurement Points

The system tracks four key stages:

1. **HID Read (2-10ms typical)**
   - Time to read raw data from the drum kit USB device
   - Affected by polling rate (default 60Hz = 16.67ms period)
   - Threshold: 5ms

2. **Mapping (1-5ms typical)**
   - Time to convert HID byte data to pad names
   - Pure function, very fast
   - Threshold: 2ms

3. **MIDI Send (5-20ms typical)**
   - Time to send MIDI note-on/note-off to FL Studio
   - Depends on MIDI library and OS USB stack
   - Threshold: 5ms

4. **Poll Cycle (20-30ms typical)**
   - Total time for one complete polling loop iteration
   - Sum of all stages plus overhead
   - Threshold: Varies by POLL_RATE_HZ

## Using the Latency Monitor

### In Your Code

The controller automatically tracks latency. Access statistics via:

```javascript
const controller = require('./src/controller');

// Start the controller
await controller.start(device);

// ... play some drums ...

// After 30+ seconds, report latency
controller.reportLatency();

// Reset measurements (optional)
controller.resetLatency();
```

### Output Example

```
============================================================
📊 Latency Report: HID Read
============================================================
Measurements: 1847
Min:          2ms
Max:          12ms
Avg:          3.45ms
Median:       3ms
P95:          5ms
P99:          8ms
============================================================

============================================================
📊 Latency Report: Mapping
============================================================
Measurements: 892
Min:          0ms
Max:          2ms
Avg:          0.15ms
Median:       0ms
P95:          1ms
P99:          1ms
============================================================

============================================================
📊 Latency Report: MIDI Send
============================================================
Measurements: 892
Min:          5ms
Max:          25ms
Avg:          8.32ms
Median:       8ms
P95:          12ms
P99:          18ms
============================================================

============================================================
📊 Latency Report: Poll Cycle
============================================================
Measurements: 1847
Min:          10ms
Max:          45ms
Avg:          22.15ms
Median:       21ms
P95:          28ms
P99:          35ms
============================================================
```

## Interpreting Results

### Total End-to-End Latency

The **Poll Cycle** value represents total latency from one polling iteration to the next. With:
- 60Hz polling (default) = ~16.67ms minimum per cycle
- Actual cycle time = 20-30ms (includes HID read + mapping + MIDI send)

**Total user latency** = Poll Cycle + FL Studio processing + audio latency

### Bottleneck Identification

| Metric | Status | Implication |
|--------|--------|------------|
| MIDI Send > 15ms | ⚠️ Slow | USB/driver issue, consider reducing POLL_RATE_HZ |
| Poll Cycle > 40ms | ⚠️ Slow | Add latency reduction measures (see below) |
| P99 much higher than avg | ⚠️ Jittery | Occasional system spikes, use realtime scheduling |

## Reducing Latency

### 1. Increase Poll Rate (Highest Impact)

```bash
# In .env
POLL_RATE_HZ=120  # Instead of default 60
```

This reads the device twice per frame instead of once:
- Theoretical latency: 16.67ms → 8.33ms
- **Trade-off**: More CPU usage, higher sensitivity to noise

### 2. Reduce Debounce

```bash
# In .env
DEBOUNCE_MS=25    # Instead of default 50
```

- Trades noise immunity for responsiveness
- Safe: Use 25-50ms range
- **Risk**: Double-triggering on shaky presses

### 3. Monitor FL Studio Settings

- **Buffer Size**: Lower = less latency (12-64 samples)
- **ASIO Buffer**: 512-1024 samples typical
- **FL Studio latency**: Usually 10-30ms

### 4. System Optimization

```bash
# Linux: Use realtime priority
sudo chrt -f 50 npm start

# Windows: Disable power saving
powercfg /change monitor-timeout-ac 0
```

### 5. Check USB Connection

- Use USB 2.0 (more stable than USB 3.0 for HID)
- Avoid USB hubs
- Check cable quality
- Run separate USB bus if possible

## Measurement Best Practices

1. **Warm Up**: Run for 30+ seconds before measuring
2. **Quiet System**: Close other apps to reduce jitter
3. **Multiple Pads**: Test different pads (some may be slower)
4. **Report Percentiles**: P95/P99 are more meaningful than max
5. **Reset Between Tests**: Use `resetLatency()` when changing settings

## Typical Latency Budget

```
HID Read:              3-5ms
Mapping:              0-1ms
MIDI Send:            5-10ms
FL Studio Processing: 10-30ms (depends on buffer)
─────────────────────────────
Total (best case):    18-47ms ≈ 50ms (2-3 frames @ 60fps audio)
```

## Advanced: Custom Measurements

```javascript
const latencyMonitor = require('./src/latencyMonitor');

// Create custom tracker
const myTracker = latencyMonitor.createLatencyTracker('CustomOp', 10);

// Use it
const start = myTracker.start();
// ... do something ...
myTracker.end(start, { context: 'padPress' });

// Get stats
const stats = myTracker.getStats();
console.log(`Average: ${stats.avg}ms, P95: ${stats.p95}ms`);
```

## Troubleshooting

### Latencies suddenly increase

- **Cause**: Background system load
- **Fix**: Close other apps, try again

### P99 much higher than P95

- **Cause**: Occasional OS spikes
- **Fix**: Use realtime priority, check Task Manager/System Monitor

### MIDI Send > 20ms consistently

- **Cause**: USB driver or FL Studio buffer issue
- **Fix**: Update drivers, lower FL Studio buffer size carefully

### Poll Cycle varies wildly (50ms+ spikes)

- **Cause**: System not meeting realtime requirements
- **Fix**: Upgrade CPU, reduce background load, increase debounce to smooth

## See Also

- `.env` - Configuration file for POLL_RATE_HZ and DEBOUNCE_MS
- `src/controller.js` - Where measurements are recorded
- `src/latencyMonitor.js` - Latency tracking implementation
