#!/usr/bin/env node

/**
 * Rock Band Drums MIDI Controller
 * Main entry point
 */

require('dotenv').config();

const detect = require('./src/detect');
const controller = require('./src/controller');

async function main() {
  console.log('🥁 Rock Band Drums MIDI Controller v0.1.0');
  console.log('============================================\n');

  try {
    // Step 1: Detect device
    console.log('📡 Scanning for Harmonix Drum Kit PS3...');
    const device = await detect.findDrumKit();

    if (!device) {
      console.error('❌ Diamond Drum Kit not found. Please connect and try again.');
      process.exit(1);
    }

    console.log(`✅ Found: ${device.name}`);
    console.log(`   Vendor: 0x${device.vendorId.toString(16).toUpperCase()}`);
    console.log(`   Product: 0x${device.productId.toString(16).toUpperCase()}\n`);

    // Step 2: Start controller
    console.log('🎵 Starting MIDI controller...');
    await controller.start(device);

    console.log('✅ Controller running. Press Ctrl+C to stop.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

main();
