// simvar-pre.js
// Ensures a global SimVar object exists before the compiled instrument script runs.
(function (global) {
  if (!global.SimVar) {
    global.SimVar = {}; // bare object so compiled code's assignments won't throw
  }
  // Minimal no-op placeholders so any early calls don't explode; these will be overridden later.
  const noop = function () { return 0; };
  if (typeof global.SimVar.GetSimVarValue !== 'function') global.SimVar.GetSimVarValue = noop;
  if (typeof global.SimVar.SetSimVarValue !== 'function') global.SimVar.SetSimVarValue = function(){ return Promise.resolve(); };
  if (typeof global.SimVar.GetRegisteredId !== 'function') global.SimVar.GetRegisteredId = function(){ return -1; };
})(window);
