/**
 * HID Diagnostics
 * Analyzes raw HID data to identify where velocity/pressure information exists
 */

const createHidAnalyzer = () => {
  const measurements = [];
  const padStatistics = {};

  return {
    recordPadPress: (data, detectedPad) => {
      if (!data || data.length === 0) return;

      const measurement = {
        timestamp: Date.now(),
        byte0: data[0],
        detectedPad: detectedPad?.padName || 'unknown',
        allBytes: Array.from(data).map((v, i) => ({ index: i, value: v })),
        nonZeroBytes: Array.from(data)
          .map((v, i) => ({ index: i, value: v }))
          .filter(b => b.value > 0),
      };

      measurements.push(measurement);

      // Track statistics per pad
      if (!padStatistics[detectedPad?.padName]) {
        padStatistics[detectedPad?.padName] = {
          count: 0,
          byteFrequency: {},
        };
      }

      const stats = padStatistics[detectedPad?.padName];
      stats.count++;

      // Track which bytes are non-zero for this pad
      measurement.nonZeroBytes.forEach(({ index, value }) => {
        if (!stats.byteFrequency[index]) {
          stats.byteFrequency[index] = [];
        }
        stats.byteFrequency[index].push(value);
      });
    },

    reportRawData: (limit = 10) => {
      console.log('\n' + '='.repeat(80));
      console.log('📊 RAW HID DATA REPORT (Last ' + limit + ' presses)');
      console.log('='.repeat(80) + '\n');

      measurements.slice(-limit).forEach((m, i) => {
        console.log(`Press #${measurements.length - limit + i + 1} - ${m.detectedPad}`);
        console.log(`  Byte[0]: ${m.byte0} (0x${m.byte0.toString(16).toUpperCase().padStart(2, '0')})`);
        console.log(`  Non-zero bytes:`);

        if (m.nonZeroBytes.length === 0) {
          console.log(`    (none)`);
        } else {
          m.nonZeroBytes.forEach(({ index, value }) => {
            console.log(`    [${index}] = ${value} (0x${value.toString(16).toUpperCase().padStart(2, '0')})`);
          });
        }
        console.log();
      });
    },

    reportStatistics: () => {
      console.log('\n' + '='.repeat(80));
      console.log('📈 PER-PAD BYTE ANALYSIS');
      console.log('='.repeat(80) + '\n');

      Object.entries(padStatistics).forEach(([padName, stats]) => {
        console.log(`\n🎵 ${padName.toUpperCase()}`);
        console.log(`   Presses recorded: ${stats.count}`);
        console.log(`   Bytes that carry data:\n`);

        Object.entries(stats.byteFrequency)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .forEach(([byteIndex, values]) => {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = max - min;

            console.log(`   Byte[${byteIndex}]:`);
            console.log(`     Min:      ${min}`);
            console.log(`     Max:      ${max}`);
            console.log(`     Avg:      ${avg.toFixed(1)}`);
            console.log(`     Variance: ${variance} (${variance === 0 ? '🔴 CONSTANT' : '🟢 VARIES'})`);
            console.log(`     Values:   [${values.join(', ')}]`);
            console.log();
          });
      });
    },

    reportPressureBytes: () => {
      console.log('\n' + '='.repeat(80));
      console.log('🔍 LOOKING FOR PRESSURE/VELOCITY BYTES');
      console.log('='.repeat(80) + '\n');

      // Find bytes that vary across measurements
      const byteVariance = {};

      measurements.forEach((m) => {
        m.allBytes.forEach(({ index, value }) => {
          if (!byteVariance[index]) {
            byteVariance[index] = new Set();
          }
          byteVariance[index].add(value);
        });
      });

      console.log('Bytes with varying values (candidates for velocity/pressure):\n');

      const candidates = Object.entries(byteVariance)
        .filter(([_, values]) => values.size > 1)
        .sort(([a], [b]) => parseInt(a) - parseInt(b));

      if (candidates.length === 0) {
        console.log('❌ NO VARYING BYTES FOUND - Hardware may not report velocity/pressure\n');
      } else {
        candidates.forEach(([byteIndex, values]) => {
          const sortedValues = Array.from(values).sort((a, b) => a - b);
          console.log(`  Byte[${byteIndex}]: ${values.size} unique values`);
          console.log(`    Range: ${Math.min(...sortedValues)} → ${Math.max(...sortedValues)}`);
          console.log(`    Sample: [${sortedValues.slice(0, 10).join(', ')}${sortedValues.length > 10 ? ', ...' : ''}]`);
          console.log();
        });
      }

      console.log('⚠️  INTERPRETATION GUIDE:');
      console.log('  - Bytes[0]:     Pad identity (known: 1, 2, 4, 8, 16)');
      console.log('  - Bytes[1]:     Unknown (check if it varies with strike intensity)');
      console.log('  - Bytes[2]:     Stuck Blue X button (ignore)');
      console.log('  - Bytes[3-6]:   Axis data (usually 128, may vary with pressure)');
      console.log('  - Bytes[7]:     Might be pressure/velocity');
      console.log('  - Bytes[8-19]:  Usually zero (might contain pressure data)');
      console.log('  - Bytes[20-26]: Baseline states (ignore)');
      console.log();
    },

    measureVelocityCorrelation: () => {
      console.log('\n' + '='.repeat(80));
      console.log('📏 VELOCITY CORRELATION TEST');
      console.log('='.repeat(80) + '\n');

      console.log('Instructions:');
      console.log('1. Press the SAME pad GENTLY (weak strike)');
      console.log('2. Then press the SAME pad HARD (strong strike)');
      console.log('3. Run this function to see which bytes changed');
      console.log('\nLooking for bytes that increase with harder strikes...\n');

      if (measurements.length < 2) {
        console.log('❌ Not enough data. Make at least 2 pad presses with different intensities.\n');
        return;
      }

      // Group by pad name
      const byPad = {};
      measurements.forEach((m) => {
        if (!byPad[m.detectedPad]) {
          byPad[m.detectedPad] = [];
        }
        byPad[m.detectedPad].push(m);
      });

      Object.entries(byPad).forEach(([padName, presses]) => {
        if (presses.length < 2) return;

        console.log(`\n${padName}:`);
        console.log(`  Comparing press #${presses.length - 1} (weak) vs #${presses.length} (hard):\n`);

        const weak = presses[presses.length - 2];
        const hard = presses[presses.length - 1];

        let foundVariance = false;

        // Check each byte
        for (let i = 0; i < Math.max(weak.allBytes.length, hard.allBytes.length); i++) {
          const weakVal = weak.allBytes[i]?.value || 0;
          const hardVal = hard.allBytes[i]?.value || 0;

          if (weakVal !== hardVal) {
            const diff = hardVal - weakVal;
            console.log(`  Byte[${i}]: ${weakVal} → ${hardVal} (diff: ${diff > 0 ? '+' : ''}${diff})`);
            foundVariance = true;
          }
        }

        if (!foundVariance) {
          console.log(`  ❌ No byte variation detected between weak and hard presses`);
          console.log(`     Hardware may not support velocity measurement`);
        }
      });

      console.log();
    },

    getLastMeasurements: (count = 5) => {
      return measurements.slice(-count);
    },

    getMeasurementCount: () => {
      return measurements.length;
    },

    reset: () => {
      measurements.length = 0;
      Object.keys(padStatistics).forEach(key => delete padStatistics[key]);
    },
  };
};

module.exports = {
  createHidAnalyzer,
};
