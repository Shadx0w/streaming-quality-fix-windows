# Widevine EME Compatibility Shim (HDCP Status Sync)

### 🛑 The "Too Long; Didn't Read" Summary (For Everyone)
**What is this?** A tiny patch for your web browser to fix a glitch where streaming platforms like Disney+ play in blurry standard definition (480p) on Windows PCs, even though you pay for a high-definition plan and your computer is perfectly capable of playing it.

**Is this illegal or a hack?** No. It does not steal movies, bypass passwords, or crack encryption. It simply copies a built-in safety setting that Mozilla Firefox already uses to fix the exact same glitch. It tells the streaming website: *"My computer is safe, please send the crisp 720p video stream I am paying for."*

**Where does it work?** This version is hardcoded to **only** touch Disney+. It is completely invisible, dormant, and inactive on every other website on the internet.

---

A lightweight developer utility and compatibility shim that aligns Chromium's Encrypted Media Extensions (EME) API behavior with native Firefox configurations. This project addresses an ongoing negotiation issue where software-backed Widevine on Windows fails to verify specific HDCP handshakes, resulting in unintended video quality downgrades (e.g., 480p caps) on streaming services where the user maintains a valid, high-definition subscription.

**This tool does not bypass, decrypt, or circumvent digital rights management (DRM).** All license requests, cryptographic keys, and stream decryptions remain completely untouched and managed entirely by the browser's native CDM (Content Decryption Module). It simply adjusts how peripheral status APIs report hardware capability gates to the player's web application interface.

## 🔍 The Underlying Issue

On certain Windows environments, Chromium-based browsers (like Microsoft Edge or Google Chrome) utilizing software-based Widevine DRM struggle to successfully negotiate the `getStatusForPolicy` handshake for HDCP 1.4 or higher, even if the underlying hardware fully supports it. 

When a streaming player queries this API and receives an indeterminate or restricted status, its internal state machine defaults to the lowest fallback resolution gate (often 480p). 

Mozilla Firefox natively resolves this environment discrepancy by allowing users to toggle a built-in configuration preference (`media.eme.hdcp-policy-check.enabled = false`). This configuration instructs the browser to safely skip the peripheral policy gate and fallback gracefully to standard resolution streams (720p) that the hardware natively supports. This extension mirrors that identical behavior for Chromium browsers.

## 🛠️ How It Works

The extension operates in the main execution world (`MAIN`) at `document_start` to intercept peripheral EME API structures before the web player initializes:

1. **Layer 1 (Policy Masking):** It masks the `MediaKeys.prototype.getStatusForPolicy` method. This replicates the native Firefox environment, signaling to the web player that the specific policy API is unavailable, which gracefully triggers the player's alternative resolution path.
2. **Layer 2 (Status Mapping):** For players that rely heavily on explicit key status arrays rather than policy queries, it intercepts `MediaKeyStatusMap.prototype`. It maps intermittent status responses like `output-restricted` or `output-downscaled` safely to `usable`, allowing the state machine to proceed normally with legitimate, encrypted streams.

## 🚀 Installation & Usage

Because browser extension catalogs strictly filter extensions modifying global media wrappers, this utility is intended to be loaded locally as an unpacked developer extension:

1. Download the code files (`manifest.json` and `inject.js`) from this repository and put them together inside a new folder on your computer named `StreamingFix`.
2. Open your browser (Microsoft Edge or Google Chrome) and type `edge://extensions` (for Edge) or `chrome://extensions` (for Chrome) into the top URL address bar and press Enter.
3. Turn on the **Developer mode** switch (usually found in the top-right corner or the left menu panel).
4. Click the **Load unpacked** button that appears.
5. Select the `StreamingFix` folder you created in Step 1.
6. Open your streaming platform and play your video. The browser will now successfully sync the 720p stream.

## ⚖️ Legal Disclaimer

This repository provides an educational case study and compatibility shim demonstrating browser environment differences. It **does not** provide methods to bypass subscription validation, access content without authorization, download streams, or strip encryption. It is intended solely for paying subscribers seeking to correct local hardware configuration negotiation errors within their own browser environment. Use of this code is at your own discretion.
