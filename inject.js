(function () {
  'use strict';

  const TAG = '[eme-shim]';
  const host = location.hostname;
  const DEBUG = false; 

  const log = (...a) => { if (DEBUG) console.log(TAG, ...a); };
  log('Compatibility shim initialized on', host);

  // ---- Layer 1: Mask getStatusForPolicy (Firefox Alignment) ----
  if (typeof MediaKeys !== 'undefined' && MediaKeys.prototype &&
      Object.getOwnPropertyNames(MediaKeys.prototype).includes('getStatusForPolicy')) {

    Object.defineProperty(MediaKeys.prototype, 'getStatusForPolicy', {
      configurable: true,
      enumerable: false,
      get() { return undefined; },
      set() {}
    });
    log('getStatusForPolicy masked successfully');
  }

  // ---- Layer 2: Key Status Mapping ----
  if (typeof MediaKeyStatusMap !== 'undefined') {
    const remap = s =>
      (s === 'output-restricted' || s === 'output-downscaled') ? 'usable' : s;

    const origGet = MediaKeyStatusMap.prototype.get;
    MediaKeyStatusMap.prototype.get = function (keyId) {
      return remap(origGet.call(this, keyId));
    };

    const origForEach = MediaKeyStatusMap.prototype.forEach;
    MediaKeyStatusMap.prototype.forEach = function (callback, thisArg) {
      return origForEach.call(this, function (status, keyId, map) {
        callback.call(thisArg, remap(status), keyId, map);
      }, thisArg);
    };

    log('Key status mapping interface active');
  }
})();
