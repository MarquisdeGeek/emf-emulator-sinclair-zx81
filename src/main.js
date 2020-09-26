let gStateVars = {
  // Settings
  autoUpdate: true,

  // Emulation
  machine: undefined,
  controller: undefined,
  framework: undefined,
  importer: undefined,

  // State
  previousCPUState: undefined,
};

$(window).load(function() {
  SGXPrepare_OS();
});

function menuAbout() {
  $('#menuAboutModal').modal('show');
}

function SGXPrepare_OS() {
  let options = {};
  let params = (new URL(document.location)).searchParams;

  // INCLUDE:OPTIONS

  gStateVars.machine = new emfzx81(options)
  gStateVars.controller = new emf.controller(gStateVars.machine, {
    onStart: function() {
      $('#emu_state').html("Running");
    },
    onStop: function() {
      $('#emu_state').html("Stopped");
      uiRefresh(gStateVars.machine);
    },
    onUpdate: function() {
      if (gStateVars.autoUpdate && gStateVars.controller.isRunning()) {
        uiRefresh(gStateVars.machine);
      }
    },
  });
  gStateVars.framework = new emf.framework(gStateVars.machine);
  gStateVars.importer = new emf.importer();
  gStateVars.framework.createMemoryDisplay({
    divTab: '#myTab',
    divContentsTab: '#myTabContent'
  });
  gStateVars.framework.populateMemoryDisplay(true);
}

function SGXinit() {
  // NOP
}

function SGXstart() {
  gStateVars.machine.start();

  uiConfigure(gStateVars.machine);

  startRunning();
}

function SGXdraw() {
  // NOP
}

function SGXupdate(telaps) {
  Main.pause();
}


function startRunning() {
  gStateVars.controller.startRunning();
  uiRefresh(gStateVars.machine);
}

function stopRunning() {
  gStateVars.controller.stopRunning();
  uiRefresh(gStateVars.machine);
}

function uiConfigure(m) {

  if (gStateVars.machine.description) {
    $('#emf_title').html(gStateVars.machine.description);
  }

  $('#emf_step').click(function(ev) {
    gStateVars.controller.step();
    uiRefresh(m);
  });

  $('#emf_stop').click(function(ev) {
    stopRunning();
  });

  $('#emf_run').click(function(ev) {
    startRunning();
  });

  $('#emf_reset').click(function(ev) {
    m.reset();
    if (typeof uiReflect2Emulator !== typeof undefined) {
      uiReflect2Emulator();
    }
    uiRefresh(m);
  });

  $('#emf_export').click(function(ev) {
    let exporter = new emf.exporter();
    let state = exporter.emfMachine(gStateVars.machine);
    let saveas = new emf.saveAs();
    saveas.saveAs(`emf_${gStateVars.machine.name}_state.emf`, state);
  });

  $('#opt_auto_update').click(function(ev) {
    gStateVars.autoUpdate = $("#opt_auto_update").is(":checked");
  });

  $('.emf_info').hide();

  function loadResource(filename, div, pc) {
    $('.emf_info').hide();

    gStateVars.importer.byURL(`res/sw/${filename}`)
      .then(function(data) {
        $(div).show();
        //
        importMachineData(gStateVars.machine, filename, data);
      })
  }

  // Games
  $('#emf_load_1kchess').click(function(ev) {
    loadResource("1kchess.p", '#emf_info_1kchess');
  });

  $('#emf_load_3dmaze').click(function(ev) {
    loadResource("3dmaze.p", '#emf_info_3dmaze');
  });

  $('#emf_load_flight').click(function(ev) {
    loadResource("flight.p", '#emf_info_flight');
  });

  $('#emf_load_hopper').click(function(ev) {
    loadResource("hopper.p", '#emf_info_hopper');
  });

  new emf.dragDrop('SGXCanvas', m, function(filename, data) {
    importMachineData(gStateVars.machine, filename, data);
    uiRefresh(m);
  });

  $('#emu_state').html("Loaded...");
}

function importMachineData(machine, filename, data) {
  // Contents of 'importMachineData' function

  if (filename.toLowerCase().indexOf('.p') !== -1) {
    let zximporter = new zx81.importer(gStateVars.machine);
    zximporter.p(filename, data);
  } else {
    gStateVars.controller.coldLoadData(filename, data, {
      startAddress: 16384
    });
  }
}

function uiRefresh(m) {
  let memoryRanges = m.bus.memory.getAddressRanges();
  let pc = m.bus.cpu.emulate.getRegisterValuePC();
  let addrFrom = pc;
  let lines = $('#SGXCanvas').height() / 14; // rule of thumb/guestimate

  gStateVars.framework.disassembleRows('#emf_disassembly_solo', m.bus.cpu, addrFrom, lines, pc);
  gStateVars.framework.registers('#emf_registers', m.bus.cpu, gStateVars.previousCPUState);
  gStateVars.framework.populateMemoryDisplay();
  //
  gStateVars.previousCPUState = m.bus.cpu.emulate.getState();
}