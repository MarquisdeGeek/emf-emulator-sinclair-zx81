var zx81 = zx81 || {};

zx81.importer = (function(machine) {

  function p(name, data) {
    let memory = machine.bus.memory;
    let cpu = machine.bus.cpu.emulate;

    // Do a cold start every time - we can support multi-part loads later
    machine.reset();
    //
    let prgptr = 0x4009;
    for(let i=0;i<data.length;++i, ++prgptr) {
      memory.write8(prgptr, data[i], true);
    }

    let newState = {
      registers: {
        intv: 0x1e,
        memrefresh: 0xca,
      },
      flags: {},
      //
      state: {
        inHalt: false,
        int_iff0: 0,
        int_iff1: 0,
        //
        //r: 0xca,
        //intv: 0x1e,
        interruptMode: 1,        
      }
    };
    cpu.setState(newState); // done first, so we can overwrite SP etc, later

    let sp = 0x7ffc;
    cpu.setRegisterValueSP(sp);
    memory.write16(sp + 0, 0x0676, true);
    memory.write16(sp + 2, 0x3e00, true);

    memory.write16(0x4002, 0x7ffc, true); // error SP
    memory.write16(0x4004, 0x8000, true); // set RAMTOP to be 16K

    memory.write16(0x4000, 0x80ff, true);
    memory.write16(0x4006, 0xfe00, true);
    memory.write8(0x4008, 0xff, true);

    // Ready the registers
    cpu.setRegisterValuePC(0x0207);
    cpu.setRegisterValueIX(0x0281);
    cpu.setRegisterValueIY(0x4000);
  }

  return {
    p,
  }
});
