let zx81_ula = (function(bus, options) {
  let isNMIGenerator;
  let isHSYNCGenerator;

  (function ctor() {})();

  function start() {

    bus.attachPin('mreq', {
      onFalling: function() {
        let address = bus.readBlock('address');

        // Read from memory?
        let rd = bus.readPinState('rd');
        if (!rd) {
          // If reading an opcode, we have this magical change
          let m1 = bus.readPinState('m1');
          if (!m1) {
            let opcode = bus.memory.read8(address & 0x7fff);

            if (address & 0x8000) {
              if (opcode & 0x40) {
                // nop : doing other lines of display
              } else {
                opcode = 0;
              }
            }
            bus.writeBlock('data', opcode);
            return;
          }

          // Else, just pull standard memory
          let data = bus.memory.read8(address);
          bus.writeBlock('data', data);
          return;
        }

        // Write to memory? We need to check both RD and RW, since it might be IO
        let wr = bus.readPinState('wr');
        if (!wr) {
          let data = bus.readBlock('data');
          bus.memory.write8(address, data);

          // Fast mode changed?
          if (false && address === 0x403b) {
            if (data & 0x40) {
              // computer and display is set (i.e. slow mode)
              bus.clock.cpu.setRate(820800);
              bus.display.setSlowMode();
            } else {
              bus.clock.cpu.setRate(3250000);
              bus.display.setFastMode();
            }
          }

        }
      },
    });
  }

  /*
  The HSYNC pulses are 5 usec wide with 64 usec between HSYNC pulses. The VSYNC
  is 400 usec wide with 16.6 msec or 20 msec between VSYNC pulses. VSYNC is used
  to synchronize the TV vertical oscillator and start the raster scan at the top
  of the screen. This occurs when IN A,FE (used for scanning the keyboard) clamps
  the video output to the SYNC level. 400us later OUT FF,A releases SYNC to enable
  the 64 us HSYNC pulses. The HSYNC pulses continue to be generated independent of
  the CPU until the next VSYNC.

  Sources:
    http://www.user.dccnet.com/wrigter/index_files/ZX%20Video%20Tutorial.htm
    https://k1.spdns.de/Vintage/Sinclair/80/Sinclair%20ZX81/Tech%20specs/zxdocs.htm#specsinternalhardware
  */
  function setNMIGenerator(isSet) {
    isNMIGenerator = isSet;
  }

  function setHSYNCGenerator(isSet) {
    if (!isSet && !isNMIGenerator) { // only turn off HSYNC if there's no NMI
      isHSYNCGenerator = isSet;
    }
  }

  function setState(json) {
    isNMIGenerator = json.nmi;
    isHSYNCGenerator = json.hsync;
  }

  function getState() {
    return {
      nmi: isNMIGenerator,
      hsync: isHSYNCGenerator,
    };
  }

  return {
    start,
    setState,
    getState,
    setNMIGenerator,
    setHSYNCGenerator,
  }
});