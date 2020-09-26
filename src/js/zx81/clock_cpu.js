const zx81_clock_cpu = (function(machine, options) {
  let cycles;
  let period;
  let timecum;
  (function ctor() {
    setRate(820800);
    reset();
  })();

  function reset() {
    timecum = 0;
  }

  function tick(t) {
    timecum += t;
    while (timecum >= period) {
      timecum -= period;
    }
  }
  // Clock device : 
  // cpu
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