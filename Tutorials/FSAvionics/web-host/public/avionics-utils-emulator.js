// avionics-utils-emulator.js
// Minimal emulation of common helpers exposed as Avionics.Utils in the MSFS environment.
// Extend with additional methods as needed.
(function(global){
  const Utils = {
    // Clamp a number between min and max
    clamp(value, min, max){
      if (value < min) return min;
      if (value > max) return max;
      return value;
    },
    // Linear interpolation
    lerp(a, b, t){
      return a + (b - a) * t;
    },
    // Inverse lerp (maps value in [a,b] to [0,1])
    invLerp(a, b, v){
      if (b === a) return 0;
      return (v - a) / (b - a);
    },
    // Map a value from one range to another
    remap(value, inMin, inMax, outMin, outMax, clampResult = false){
      const t = this.invLerp(inMin, inMax, value);
      const u = clampResult ? this.clamp(t, 0, 1) : t;
      return this.lerp(outMin, outMax, u);
    },
    // Degrees to radians
    toRad(deg){ return deg * Math.PI / 180; },
    // Radians to degrees
    toDeg(rad){ return rad * 180 / Math.PI; },
    // Normalize angle to [0,360)
    normDeg360(deg){
      let d = deg % 360;
      if (d < 0) d += 360;
      return d;
    },
    // Normalize angle to (-180,180]
    normDeg180(deg){
      let d = this.normDeg360(deg);
      if (d > 180) d -= 360;
      return d;
    },
    // Heading difference shortest path (-180..180)
    headingDiff(a, b){
      return this.normDeg180(b - a);
    },
    // Simple smoothing filter
    damp(current, target, lambda, dt){
      // Exponential decay approach: new = lerp(target, current, e^{-lambda*dt}) reversed
      const e = Math.exp(-lambda * dt);
      return current * e + target * (1 - e);
    },
    // Format number fixed with trimming of trailing zeros
    toFixedTrim(value, decimals){
      return Number(value).toFixed(decimals).replace(/\.0+$/,'').replace(/(\..*?)0+$/,'$1');
    },
    // Pad runway number to 2 digits
    padRunway(num){
      const n = parseInt(num,10);
      if (isNaN(n)) return '';
      return n.toString().padStart(2,'0');
    }
  };

  if (!global.Avionics) global.Avionics = {};
  global.Avionics.Utils = Utils;
  console.info('[AvionicsUtilsEmu] Initialized');
})(window);
