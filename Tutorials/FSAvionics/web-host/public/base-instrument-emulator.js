// base-instrument-emulator.js
// Minimal emulation of MSFS BaseInstrument + registerInstrument for browser hosting.
// Focus: provide lifecycle + template stamping + update loop so existing instrument code runs.
(function(global){
  const pendingInstruments = [];
  let domReady = document.readyState !== 'loading';

  function onReady(fn){
    if(domReady) { fn(); } else { document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  }
  document.addEventListener('DOMContentLoaded', () => { domReady = true; });

  class BaseInstrument {
    constructor(){
      this.__connected = false;
      this.__updateActive = true;
      this.__frameHandle = null;
    }
    // Subclasses generally override templateID getter.
    get templateID(){ return ''; }
    connectedCallback(){ this.__connected = true; }
    disconnectedCallback(){ this.__connected = false; this.__updateActive = false; }
    // Placeholder for attribute changes.
    attributeChangedCallback(){ /* noop */ }
    // Called every frame (instrument override implements logic in Update loop externally)
    Update(){ /* to be overridden */ }
    // Internal: start RAF loop
    __startUpdateLoop(){
      const inst = this;
      function tick(){
        if(!inst.__updateActive) return;
        try { inst.Update && inst.Update(); } catch(e){ console.error('[BaseInstrumentEmu] Update error', e); }
        inst.__frameHandle = global.requestAnimationFrame(tick);
      }
      inst.__frameHandle = global.requestAnimationFrame(tick);
    }
  }

  function stampTemplate(inst){
    const id = inst.templateID;
    if(!id){ console.warn('[BaseInstrumentEmu] No templateID on instrument'); return; }
    const tpl = document.querySelector(`script#${id}[type="text/html"]`);
    if(!tpl){ console.warn('[BaseInstrumentEmu] Template not found for', id); return; }
    // If InstrumentContent already exists, verify it's outside the <script>; if still inside script (not stamped) proceed.
    const existing = document.getElementById('InstrumentContent');
    if(existing && existing.parentElement && existing.parentElement.tagName !== 'SCRIPT') {
      console.debug('[BaseInstrumentEmu] InstrumentContent already stamped in DOM');
      return;
    }
    // Ensure body exists
    let body = document.body;
    if(!body){
      body = document.createElement('body');
      document.documentElement.appendChild(body);
      console.warn('[BaseInstrumentEmu] No <body> found; created one');
    }
  // Remove any previous root wrappers for a clean re-stamp (hot reload / HMR safety)
    const prior = document.getElementById(id + '_root');
    if(prior) { prior.remove(); }
    const wrapper = document.createElement('div');
    wrapper.id = id + '_root';
    wrapper.className = 'instrument-root';
    wrapper.innerHTML = tpl.innerHTML;
  // Host layer may supply a #__instrument_host container; otherwise append to body.
  const target = document.getElementById('__instrument_host') || body;
  target.appendChild(wrapper);
  console.debug('[BaseInstrumentEmu] Stamped template for', id, 'into', target.id || 'body');
    if(body.children.length === 0){
      console.warn('[BaseInstrumentEmu] Body still empty after stamping – something is wrong');
    }
  }

  function instantiateInstrument(def){
    try {
      const inst = new def.ctor();
      stampTemplate(inst);
      // Call subclass connectedCallback chain
      if(typeof inst.connectedCallback === 'function'){
        try { inst.connectedCallback(); } catch(e){ console.error('[BaseInstrumentEmu] connectedCallback error', e); }
      }
      inst.__startUpdateLoop();
      console.info('[BaseInstrumentEmu] Instrument started:', def.name);
      return inst;
    } catch(e){
      console.error('[BaseInstrumentEmu] Failed to instantiate instrument', def.name, e);
      return null;
    }
  }

  function processPending(){
    while(pendingInstruments.length){
      const def = pendingInstruments.shift();
      instantiateInstrument(def);
    }
  }

  function registerInstrument(name, ctor){
    pendingInstruments.push({ name, ctor });
    onReady(processPending);
    console.debug('[BaseInstrumentEmu] Registered instrument', name);
  }

  global.BaseInstrument = BaseInstrument;
  global.registerInstrument = registerInstrument;
  console.info('[BaseInstrumentEmu] Initialized');
})(window);
