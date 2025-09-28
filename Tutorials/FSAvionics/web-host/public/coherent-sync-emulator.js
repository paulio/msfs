// coherent-sync-emulator.js
// Emulates minimal Coherent / generic data listener APIs used by EventBusListenerSync.
(function(global){
  // Generic listener registration stub.
  function RegisterGenericDataListener(callback){
    // Keep a small interval to simulate receiving sync packets (empty for now)
    const handle = setInterval(() => {
      // In real sim: would invoke callback with (key, data)
      // We'll no-op; or could send a heartbeat.
      // callback('wt.eb.evt', '{}'); // optional heartbeat
    }, 5000);
    return {
      unregister(){ clearInterval(handle); },
      // mimic interface shape used by sdk (if any)
    };
  }

  // Event broadcast stub.
  function SendGenericEvent(/*name, payload*/){
    // No-op; could log.
  }

  // Flow event stubs for completeness.
  function Coherent(){ /* placeholder namespace if code checks */ }

  global.RegisterGenericDataListener = global.RegisterGenericDataListener || RegisterGenericDataListener;
  global.SendGenericEvent = global.SendGenericEvent || SendGenericEvent;
  if(!global.Coherent) global.Coherent = {};
  if(!global.Coherent.call){ global.Coherent.call = function(){ /* noop */ }; }

  console.info('[CoherentSyncEmu] Generic data listener emulated');
})(window);
