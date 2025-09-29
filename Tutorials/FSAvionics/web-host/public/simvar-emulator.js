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

  // --- Config-driven variable seeding & evolution ---------------------------
  // A JSON file (simvars.json) can define variables and behaviour. Example:
  // { intervalMs: 1000, variables: [{ name, unit, initial, randomWalk:{min,max,step}, decrement, cycle:{count,probability}, derivedFrom, formula }] }
  // The file is optional; if missing we fallback to defaults.

  async function loadConfig(){
    try {
      const res = await fetch('/_public/simvars.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    } catch (e) {
      console.warn('[SimVarEmu] simvars.json not found or invalid, using baked defaults.', e);
      return {
        intervalMs: 1000,
        variables: [
          { name: 'AIRSPEED INDICATED', unit: 'knots', initial: 110, randomWalk:{ min:60, max:160, step:1.2 } },
          { name: 'FUEL TOTAL QUANTITY', unit: 'gallons', initial: 40, decrement: 0.01 },
            { name: 'FUEL TOTAL CAPACITY', unit: 'gallons', initial: 50 },
          { name: 'FLAPS HANDLE INDEX', unit: 'number', initial: 0, cycle:{ count:4, probability:0.01 } },
          { name: 'TRAILING EDGE FLAPS LEFT PERCENT', unit: 'percent', initial: 0, derivedFrom: 'FLAPS HANDLE INDEX', formula: '(base/3)*100' }
        ]
      };
    }
  }

  function seedVariable(v){
    const key = v.name.toUpperCase();
    if (!_store.has(key)){
      _store.set(key, { value: v.initial ?? 0, unit: v.unit || '' });
    }
  }

  function evaluateFormula(formula, context){
    try {
      // Very constrained eval: replace allowed identifiers then use Function.
      // context = { base, value }
      const fn = new Function('base','value',`return (${formula});`); // eslint-disable-line no-new-func
      return fn(context.base, context.value);
    } catch (e) {
      console.warn('[SimVarEmu] Formula error', formula, e);
      return 0;
    }
  }

  function startEngine(cfg){
    // Initial seed
    cfg.variables.forEach(seedVariable);

    const interval = cfg.intervalMs || 1000;
    setInterval(() => {
      for (const v of cfg.variables){
        const key = v.name.toUpperCase();
        const entry = _store.get(key);
        if (!entry) continue;

        if (v.randomWalk){
          entry.value = randomWalk(entry.value, v.randomWalk.min, v.randomWalk.max, v.randomWalk.step);
        }
        if (typeof v.decrement === 'number'){
          entry.value = Math.max(0, entry.value - v.decrement);
        }
        if (v.cycle && Math.random() < (v.cycle.probability || 0)){
          entry.value = (entry.value + 1) % (v.cycle.count || 1);
        }
        if (v.derivedFrom){
          const baseEntry = _store.get(v.derivedFrom.toUpperCase());
          if (baseEntry){
            if (v.formula){
              entry.value = evaluateFormula(v.formula, { base: baseEntry.value, value: entry.value });
            } else {
              entry.value = baseEntry.value;
            }
          }
        }
      }
    }, interval);
  }

  loadConfig().then(cfg => {
    startEngine(cfg);
    console.info('[SimVarEmu] Loaded config with', cfg.variables.length, 'variables');
  });

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

  console.info('[SimVarEmu] Initialized (config pending)...');
})(window);
