// simvar-emulator.js
// Lightweight browser-side SimVar emulation for local hosting.
// NOTE: This is a pragmatic subset aimed at your current instrument needs.
(function(global){
  const SimVar = global.SimVar = global.SimVar || {};

  // Low-level simvar interface expected by compiled msfs-sdk shim (simvar.* methods)
  if (!global.simvar) {
    global.simvar = {
      getValueReg(id){
        // id maps to name by reverse lookup
        for (const [nameId, valId] of _registered.entries()) {
          if (valId === id) {
            const entry = _store.get(nameId);
            return entry ? entry.value : 0;
          }
        }
        return 0;
      },
      getValueReg_String(id){
        const v = this.getValueReg(id);
        return String(v);
      },
      getValue_LatLongAlt(/*name, source*/){ return { lat:0, long:0, alt:0 }; },
      getValue_LatLongAltPBH(/*name, source*/){ return { lat:0, long:0, alt:0, pitch:0, bank:0, heading:0 }; },
      getValue_PBH(/*name, source*/){ return { pitch:0, bank:0, heading:0 }; },
      getValue_PID_STRUCT(/*name, source*/){ return { p:0, i:0, d:0 }; },
      getValue_XYZ(/*name, source*/){ return { x:0, y:0, z:0 }; }
    };
  }

  // Internal store for values; keyed by name (upper-case) + optional unit.
  const _store = new Map();
  const _registered = new Map(); // maps key to id
  let _nextId = 1;

  // Basic random walk helpers to keep gauges moving.
  function randomWalk(current, min, max, step){
    const delta = (Math.random() * step * 2) - step;
    let v = current + delta;
    if (v < min) v = min;
    if (v > max) v = max;
    return v;
  }

  // Seed a few values your instrument reads.
  function seedIfAbsent(name, unit, init){
    const key = name.toUpperCase();
    if (!_store.has(key)){
      _store.set(key, { value: init, unit });
    }
  }

  // Known variables (subset). Extend as needed.
  seedIfAbsent('AIRSPEED INDICATED', 'knots', 110);
  seedIfAbsent('FUEL TOTAL QUANTITY', 'gallons', 40); // current fuel
  seedIfAbsent('FUEL TOTAL CAPACITY', 'gallons', 50); // tank capacity
  seedIfAbsent('FLAPS HANDLE INDEX', 'number', 0);
  seedIfAbsent('TRAILING EDGE FLAPS LEFT PERCENT', 'percent', 0);

  // Periodic evolution of dynamic vars.
  setInterval(() => {
    const air = _store.get('AIRSPEED INDICATED');
    air.value = randomWalk(air.value, 60, 160, 1.2);

    // Simulate slow burn of fuel quantity.
    const fuel = _store.get('FUEL TOTAL QUANTITY');
    fuel.value = Math.max(0, fuel.value - 0.01); // ~1 unit per 100s

    // Flaps: occasionally move.
    if (Math.random() < 0.01) {
      const flaps = _store.get('FLAPS HANDLE INDEX');
      flaps.value = (flaps.value + 1) % 4; // cycle 0-3
      const flapsPct = _store.get('TRAILING EDGE FLAPS LEFT PERCENT');
      flapsPct.value = (flaps.value / 3) * 100;
    }
  }, 1000); // 1 Hz update

  // Registration mimics returning an integer id; we just map to the key.
  SimVar.GetRegisteredId = function(name, unit /*ignored*/, source /*ignored*/){
    const key = name.toUpperCase();
    if (!_registered.has(key)){
      _registered.set(key, _nextId++);
    }
    return _registered.get(key);
  };

  // In real MSFS there are struct types; here we return simple numbers.
  SimVar.GetSimVarValue = function(name, unit /*ignored*/, source /*ignored*/){
    const key = name.toUpperCase();
    const entry = _store.get(key);
    if (!entry){
      console.warn('[SimVarEmu] Unknown SimVar requested:', name);
      return 0;
    }
    return entry.value;
  };

  SimVar.SetSimVarValue = function(name, unit, value){
    const key = name.toUpperCase();
    if (!_store.has(key)){
      _store.set(key, { value, unit });
    } else {
      _store.get(key).value = value;
    }
    return Promise.resolve();
  };

  // Convenience: allow manual tweaking from devtools.
  SimVar.__set = (name, v) => {
    const key = name.toUpperCase();
    if (_store.has(key)) _store.get(key).value = v; else _store.set(key, { value: v, unit: '' });
  };
  SimVar.__dump = () => {
    const obj = {};
    for (const [k,v] of _store.entries()) obj[k] = v.value;
    console.table(obj);
  };

  console.info('[SimVarEmu] Initialized (subset). Registered keys:', Array.from(_store.keys()));
})(window);
