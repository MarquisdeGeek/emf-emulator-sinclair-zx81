let zx81_iorq = (function(bus, options) {
  /*
  https://github.com/TomHarte/CLK/wiki/The-ZX80-and-ZX81

  Programmatic sync is used for vertical synchronisation. Reading from any port
   which had an address with the low bit clear causes the synchronisation signal to begin. 
  (a == 0xfe would appear to do this)

   Writing to any port causes it to end.
  */

  function start() {
    bus.attachPin('iorq', {
      onFalling: function() {
        let port = bus.readBlock('address');

        // Read from IO?
        let rd = bus.readBlock('rd');
        if (!rd) {
          let data = readPort(port);
          bus.writeBlock('data', data);
          return;
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

    let a = addr & 0xff;
    let retval = 0xff;

    switch (a) {
      case 0xFE:
        bus.ula.setHSYNCGenerator(false);

        let h = addr >> 8;
        switch (h) {
          case 0xfe:
            retval = zx81_keyboard.getRow(0);
            break;
          case 0xfd:
            retval = zx81_keyboard.getRow(1);
            break;
          case 0xfb:
            retval = zx81_keyboard.getRow(2);
            break;
          case 0xf7:
            retval = zx81_keyboard.getRow(3);
            break;
          case 0xef:
            retval = zx81_keyboard.getRow(4);
            break;
          case 0xdf:
            retval = zx81_keyboard.getRow(5);
            break;
          case 0xbf:
            retval = zx81_keyboard.getRow(6);
            break;
          case 0x7f:
            retval = zx81_keyboard.getRow(7);
            break;

          default:
            for (let i = 0, mask = 1; i < 8; i++, mask <<= 1) {
              if (!(h & mask)) {
                retval &= zx81_keyboard.getRow(i);
              }
            }
        }
    }

    return retval;
  }

  function writePort(addr, val) {
    addr = addr.getUnsigned ? addr.getUnsigned() : addr;

    let a = addr & 0xff;
    switch (a) {
      case 0xFD:
        bus.ula.setNMIGenerator(false);
        bus.ula.setHSYNCGenerator(true);
        break;

      case 0xFE:
        //bus.ula.setHSYNCGenerator(true); ZX80 only
        bus.ula.setNMIGenerator(true);
        break;

      case 0x07:
      case 0xFF:
        bus.ula.setHSYNCGenerator(true);
        break;
    }
  }

  function setState(json) {
    zx81_keyboard.setState(json.keyboard);
  }

  function getState() {
    return {
      keyboard: zx81_keyboard.getState()
    };
  }

  return {
    readPort,
    writePort,
    //
    setState,
    getState,
  }
});