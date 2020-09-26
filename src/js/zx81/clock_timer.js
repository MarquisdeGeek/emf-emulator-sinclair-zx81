const zx81_clock_timer = (function(machine, options) {
  let cycles;
  let period;
  let timecum;
  (function ctor() {
    setRate(60);
    reset();
  })();

  function reset() {
    timecum = 0;
  }

  function tick(t) {
    timecum += t;
    while (timecum >= period) {
      machine.bus.pulseLow('vsync')
      timecum -= period;
    }
  }
  // Clock device : 
  // timer
  function setRate(hz) {
    cycles = hz;
    period = 1 / hz;
  }

  function getFrequency() {
    return cycles;
  }
  return {
    reset,
    tick,
    setRate,
    getFrequency,
  };
});