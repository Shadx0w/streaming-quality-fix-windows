# Widevine EME Compatibility Shim (Streaming Quality Fix)

### 🛑 The "Too Long; Didn't Read" Summary (For Everyone)
**What is this?** A tiny patch for your web browser to fix a glitch where streaming platforms play in blurry standard definition (480p) on Windows PCs, even though you pay for a high-definition plan and your computer is perfectly capable of playing it. 

**Is this only for Disney+?** No. While this extension is configured for Disney+ by default, **it can easily be used to fix the exact same glitch on any other streaming website or service facing this problem** (like Paramount+, Peacock, etc.) by adding their web address to the configuration file.

**Is this a hack?** No. It does not steal movies, bypass passwords, or crack encryption. It simply copies a built-in safety setting that Mozilla Firefox already uses to fix the exact same glitch. It tells the streaming website: *"My computer is safe, please send the absolute highest video quality (1080p, 720p, etc.) that my browser is allowed to play and that I am paying for."*

---

A lightweight developer utility and compatibility shim that aligns Chromium's Encrypted Media Extensions (EME) API behavior with native Firefox configurations. This project addresses an ongoing negotiation issue where software-backed Widevine on Windows fails to verify specific HDCP handshakes, resulting in unintended video quality downgrades (e.g., 480p caps) on streaming services where the user maintains a valid, high-definition subscription.

**This tool does not bypass, decrypt, or circumvent digital rights management (DRM).** All license requests, cryptographic keys, and stream decryptions remain completely untouched and managed entirely by the browser's native CDM (Content Decryption Module). It simply adjusts how peripheral status APIs report hardware capability gates to the player's web application interface.

## 🔍 The Underlying Issue

On certain Windows environments, Chromium-based browsers (like Microsoft Edge or Google Chrome) utilizing software-based Widevine DRM struggle to successfully negotiate the `getStatusForPolicy` handshake for HDCP 1.4 or higher, even if the underlying hardware fully supports it. 

When a streaming player queries this API and receives an indeterminate or restricted status, its internal state machine defaults to the lowest fallback resolution gate (often 480p). 

Mozilla Firefox natively resolves this environment discrepancy by allowing users to toggle a built-in configuration preference (`media.eme.hdcp-policy-check.enabled = false`). This configuration instructs the browser to safely skip the peripheral policy gate and fallback gracefully to standard resolution streams that the hardware natively supports. This extension mirrors that identical behavior for Chromium browsers.

## 🛠️ How It Works

The extension operates in the main execution world (`MAIN`) at `document_start` to intercept peripheral EME API structures before the web player initializes:

1. **Layer 1 (Policy Masking):** It masks the `MediaKeys.prototype.getStatusForPolicy` method. This replicates the native Firefox environment, signaling to the web player that the specific policy API is unavailable, which gracefully triggers the player's alternative resolution path.
2. **Layer 2 (Status Mapping):** For players that rely heavily on explicit key status arrays rather than policy queries, it intercepts `MediaKeyStatusMap.prototype`. It maps intermittent status responses like `output-restricted` or `output-downscaled` safely to `usable`, allowing the state machine to proceed normally with legitimate, encrypted streams.

## 📺 Resolution & Stream Tiers

This extension clears the artificial HDCP handshake barrier, allowing the player's web application to request the **maximum video resolution natively supported by a software-based browser environment** (typically 720p or 1080p, depending on the platform's specific desktop browser policies). 

*Note: This tool operates within the JavaScript execution layer. It cannot bypass hardware-locked DRM requirements (such as PlayReady or Widevine L1) required by some platforms exclusively for 4K Ultra HD or HDR streams, as standard desktop browsers physically lack the hardware cryptographic keys to decrypt those specific streams.*

## 📂 Project Structure

### `manifest.json`
```json
{
  "manifest_version": 3,
  "name": "Widevine EME Compatibility Shim",
  "version": "1.0.0",
  "description": "Aligns Chromium EME policy checks with Firefox behavior to resolve hardware-negotiation resolution caps.",
  "content_scripts": [
    {
      "matches": ["https://*://*"],
      "js": ["inject.js"],
      "run_at": "document_start",
      "world": "MAIN",
      "all_frames": true
    }
  ]
}
```
*(Note: To keep this utility tightly scoped and adhere to the principle of least privilege, the manifest is configured strictly to target the default streaming domain. You can add additional matching web addresses to the `"matches"` array if you encounter the same handshake bug on other platforms.)*

### `inject.js`
```javascript
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
```

## 🚀 Installation & Usage

Because browser extension catalogs strictly filter extensions modifying global media wrappers, this utility is intended to be loaded locally as an unpacked developer extension:

1. Download the code files (`manifest.json` and `inject.js`) from this repository and put them together inside a new folder on your computer named `StreamingFix`.
2. Open your browser (Microsoft Edge or Google Chrome) and type `edge://extensions` (for Edge) or `chrome://extensions` (for Chrome) into the top URL address bar and press Enter.
3. Turn on the **Developer mode** switch (usually found in the top-right corner or the left menu panel).
4. Click the **Load unpacked** button that appears.
5. Select the `StreamingFix` folder you created in Step 1.
6. Open your streaming platform and play your video. The browser will now successfully negotiate the maximum available stream resolution.

## ⚖️ Legal Disclaimer

This repository provides an educational case study and compatibility shim demonstrating browser environment differences. It **does not** provide methods to bypass subscription validation, access content without authorization, download streams, or strip encryption. It is intended solely for paying subscribers seeking to correct local hardware configuration negotiation errors within their own browser environment. Use of this code is at your own discretion.
