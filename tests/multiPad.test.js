/**
 * Multi-Pad Simultaneous Press Tests
 * Verifies that multiple pads pressed at the same time are handled correctly
 */

jest.mock('../src/detect');
jest.mock('../src/midiOutput');
jest.mock('../src/mapper');

describe('Multi-Pad Simultaneous Press Handling', () => {
  let consoleSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('should send MIDI for two simultaneous pads (red + yellow)', async () => {
    process.env.DEBUG = 'false';
    const config = require('../src/config');
    const detect = require('../src/detect');
    const midiOutput = require('../src/midiOutput');
    const mapper = require('../src/mapper');
    const controller = require('../src/controller');

    const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
    detect.openDevice.mockReturnValue(mockDevice);
    midiOutput.initMidiOutput.mockImplementation(() => {});
    midiOutput.closeMidiOutput.mockImplementation(() => {});
    midiOutput.sendNoteOn.mockImplementation(() => {});
    midiOutput.sendNoteOff.mockImplementation(() => {});

    const redYellowData = Buffer.alloc(27);
    redYellowData[0] = 4 | 8; // red + yellow
    mockDevice.readSync.mockReturnValue(redYellowData);

    mapper.mapPadToNote.mockImplementation((padName) => {
      const notes = { red: 38, yellow: 42 };
      return notes[padName];
    });
    mapper.getVelocity.mockReturnValue(100);

    const presses = [
      { padName: 'red', velocity: 4 },
      { padName: 'yellow', velocity: 8 },
    ];

    let callCount = 0;
    mapper.mapHidDataToPad.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? presses : [];
    });

    await controller.start({ vendorId: 0x12ba, productId: 0x0210 });
    jest.advanceTimersByTime(100);

    expect(midiOutput.sendNoteOn).toHaveBeenCalledTimes(2);

    controller.stop();
    jest.runAllTimers();
  });

  test('should release only the pad that was released (not others)', async () => {
    process.env.DEBUG = 'false';
    const config = require('../src/config');
    const detect = require('../src/detect');
    const midiOutput = require('../src/midiOutput');
    const mapper = require('../src/mapper');
    const controller = require('../src/controller');

    const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
    detect.openDevice.mockReturnValue(mockDevice);
    midiOutput.initMidiOutput.mockImplementation(() => {});
    midiOutput.closeMidiOutput.mockImplementation(() => {});
    midiOutput.sendNoteOn.mockImplementation(() => {});
    midiOutput.sendNoteOff.mockImplementation(() => {});

    mapper.mapPadToNote.mockImplementation((padName) => {
      const notes = { red: 38, yellow: 42 };
      return notes[padName];
    });
    mapper.getVelocity.mockReturnValue(100);

    let cycleCount = 0;

    mapper.mapHidDataToPad.mockImplementation(() => {
      cycleCount++;
      if (cycleCount <= 2) {
        // First two cycles: red + yellow pressed
        return [
          { padName: 'red', velocity: 4 },
          { padName: 'yellow', velocity: 8 },
        ];
      } else {
        // Third cycle: only red still pressed (yellow released)
        return [{ padName: 'red', velocity: 4 }];
      }
    });

    const data = Buffer.alloc(27);
    mockDevice.readSync.mockReturnValue(data);

    await controller.start({ vendorId: 0x12ba, productId: 0x0210 });

    // Cycle 1-2: both note-ons
    jest.advanceTimersByTime(50);
    expect(midiOutput.sendNoteOn).toHaveBeenCalledTimes(2);

    // Cycle 3: yellow note-off only
    jest.advanceTimersByTime(50);
    expect(midiOutput.sendNoteOff).toHaveBeenCalledTimes(1);
    expect(midiOutput.sendNoteOff).toHaveBeenCalledWith(42); // yellow note

    controller.stop();
    jest.runAllTimers();
  });

  test('should handle all 5 pads pressed simultaneously', async () => {
    process.env.DEBUG = 'false';
    const detect = require('../src/detect');
    const midiOutput = require('../src/midiOutput');
    const mapper = require('../src/mapper');
    const controller = require('../src/controller');

    const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
    detect.openDevice.mockReturnValue(mockDevice);
    midiOutput.initMidiOutput.mockImplementation(() => {});
    midiOutput.closeMidiOutput.mockImplementation(() => {});
    midiOutput.sendNoteOn.mockImplementation(() => {});
    midiOutput.sendNoteOff.mockImplementation(() => {});

    mapper.mapPadToNote.mockImplementation((padName) => {
      const notes = { red: 38, yellow: 42, blue: 48, green: 49, kick: 36 };
      return notes[padName];
    });
    mapper.getVelocity.mockReturnValue(100);

    const allPadsData = Buffer.alloc(27);
    allPadsData[0] = 1 | 2 | 4 | 8 | 16; // all pads
    mockDevice.readSync.mockReturnValue(allPadsData);

    const allPads = [
      { padName: 'blue', velocity: 1 },
      { padName: 'green', velocity: 2 },
      { padName: 'red', velocity: 4 },
      { padName: 'yellow', velocity: 8 },
      { padName: 'kick', velocity: 16 },
    ];

    let callCount = 0;
    mapper.mapHidDataToPad.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? allPads : [];
    });

    await controller.start({ vendorId: 0x12ba, productId: 0x0210 });
    jest.advanceTimersByTime(100);

    // All 5 pads should send note-on
    expect(midiOutput.sendNoteOn).toHaveBeenCalledTimes(5);

    controller.stop();
    jest.runAllTimers();
  });

  test('should handle three pads pressed then two released', async () => {
    process.env.DEBUG = 'false';
    const detect = require('../src/detect');
    const midiOutput = require('../src/midiOutput');
    const mapper = require('../src/mapper');
    const controller = require('../src/controller');

    const mockDevice = { readSync: jest.fn(() => Buffer.alloc(27)) };
    detect.openDevice.mockReturnValue(mockDevice);
    midiOutput.initMidiOutput.mockImplementation(() => {});
    midiOutput.closeMidiOutput.mockImplementation(() => {});
    midiOutput.sendNoteOn.mockImplementation(() => {});
    midiOutput.sendNoteOff.mockImplementation(() => {});

    mapper.mapPadToNote.mockImplementation((padName) => {
      const notes = { red: 38, yellow: 42, kick: 36 };
      return notes[padName];
    });
    mapper.getVelocity.mockReturnValue(100);

    let cycleCount = 0;

    mapper.mapHidDataToPad.mockImplementation(() => {
      cycleCount++;
      if (cycleCount <= 2) {
        // First two cycles: red, yellow, kick
        return [
          { padName: 'red', velocity: 4 },
          { padName: 'yellow', velocity: 8 },
          { padName: 'kick', velocity: 16 },
        ];
      } else {
        // Third cycle: only red remains
        return [{ padName: 'red', velocity: 4 }];
      }
    });

    const data = Buffer.alloc(27);
    mockDevice.readSync.mockReturnValue(data);

    await controller.start({ vendorId: 0x12ba, productId: 0x0210 });

    jest.advanceTimersByTime(50);
    expect(midiOutput.sendNoteOn).toHaveBeenCalledTimes(3);

    jest.advanceTimersByTime(50);
    // Two note-offs: yellow (42) and kick (36)
    expect(midiOutput.sendNoteOff).toHaveBeenCalledTimes(2);

    controller.stop();
    jest.runAllTimers();
  });
});
