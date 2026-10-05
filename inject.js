// Widevine EME Compatibility Shim v1.0.0
//
// Layer 1: masks MediaKeys.getStatusForPolicy so it reads as "doesn't
//   exist" — the same state Firefox is in with
//   media.eme.hdcp-policy-check.enabled = false. Players with a
//   "no API -> skip the resolution gate" branch will use it.
//
// Layer 2: remaps 'output-restricted' / 'output-downscaled' key
//   statuses to 'usable' for players that gate on those instead.
//
// Nothing here touches the DRM chain: licenses still validate, keys
// stay real, streams stay encrypted.
(function () {
  'use strict';

  // ========================= CONFIG =========================
  const DEBUG = false;          // true = console logging
  const REMAP_STATUSES = true;  // Layer 2; set false if a service acts up
  const DISABLED_HOSTS = [];    // e.g. ['example.com'] to skip a site
  // ==========================================================

  const TAG = '[hdcp-override]';
  const host = location.hostname;

  if (DISABLED_HOSTS.some(h => host === h || host.endsWith('.' + h))) return;

  const log = (...a) => { if (DEBUG) console.log(TAG, ...a); };
  log('v2.1 active on', host);

  // ---- Layer 1: mask getStatusForPolicy (proven semantics) ----
  if (typeof MediaKeys !== 'undefined' && MediaKeys.prototype &&
      Object.getOwnPropertyNames(MediaKeys.prototype).includes('getStatusForPolicy')) {

    Object.defineProperty(MediaKeys.prototype, 'getStatusForPolicy', {
      configurable: true,
      enumerable: false,
      get() { return undefined; },
      set() {}
    });
    log('getStatusForPolicy masked');
  }

  // ---- Layer 2: key status remap ----
  if (REMAP_STATUSES && typeof MediaKeyStatusMap !== 'undefined') {
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

    log('key status remap active');
  }
})();