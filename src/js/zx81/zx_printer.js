let zx_printer = (function(bus, options) {
  /*
  D0 Low/High from encoder disc
  D1 High = Motor on slow speed (unless D2 is high)
  D2 High = Stop the motor (high). Low = Start the motor
  //...
  D6 Low if printer connected, otherwise high
  D7 High = Power to stylus

  */
  let latchPaperStart = true;
  let latchNextPixel = true;
  let prevUptime;
  let motorOn;
  let outline;

  function start() {
    motorOn = false;
    outline = '';
    //
    bus.attachPin('iorq', {
      onFalling: function() {
        let port = bus.readBlock('address');

        // Read from IO?
        let rd = bus.readBlock('rd');
        if (!rd) {
          return readPort(port);
        }

        // Write to IO? We need to check both RD and RW, since it might be memory
        let wr = bus.readBlock('wr');
        if (!wr) {
          let data = bus.readBlock('data');
          writePort(address, data);
          return;
        }
      },
    });
  }

  function readPort(addr) {
    addr = addr.getUnsigned ? addr.getUnsigned() : addr;

    if ((addr & 0x40) === 0) {
      let state = 0x3e;
      state |= latchPaperStart ? 0x80 : 0;
      state |= latchNextPixel ? 0x01 : 0;
      bus.writeBlock('data', state);
    }
  }

  function writePort(addr, val) {
    addr = addr.getUnsigned ? addr.getUnsigned() : addr;
    if ((addr & 0x40) === 0) {
      val = val.getUnsigned ? val.getUnsigned() : val;
      let uptime = bus.clock.cpu.getUptime();
      prevUptime = prevUptime || uptime; // in case undefined
      onPrinterPortRead(val.getUnsigned(), uptime - prevUptime);

      prevUptime = uptime;
    }
  }

  function onPrinterPortRead(value, telaps) {
    let wasMotorOn = motorOn;
    let stylusOn = (value & 0x80) ? true : false;
    let speedSlow = (value & 0x01) ? true : false; // the HW needs this, but the BASIC stills the same number of OUT commands in either case
    motorOn = (value & 0x04) ? false : true;
    //
    // start to print
    if (motorOn && !wasMotorOn) {
      outline = '';
      telaps = 0;
    }
    //
    coverage = telaps * 100000;
    if (coverage > 5) {
      // one of the two CR
    } else if (coverage > 4) {
      // the other one
    } else {
      printerWrite(stylusOn);
    }
  }

  function printerWrite(bitSet) {
    outline += bitSet ? '*' : ' ';

    if (outline.length >= 256) {
      outline = outline.substr(256);
      latchPaperStart = true;
    }
  }

  return {
    readPort,
    writePort,
  }
});