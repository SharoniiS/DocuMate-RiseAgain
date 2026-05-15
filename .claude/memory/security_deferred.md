---
name: Security — Deferred Until Pre-Cloud
description: Security hardening was deliberately deferred; must warn before adding backend/cloud sync
type: project
originSessionId: bf19311c-06e1-4d0e-ab24-f22f7f8be276
---
Security hardening is intentionally deferred — the app doesn't have core functionality working yet (document recognition is not complete).

**Why:** Building encryption before product-market fit is wasted effort. The real risk is cloud/backend, not local on-device storage.

**How to apply:** When the user mentions adding a backend, cloud sync, server storage, or sharing documents with others — **stop and warn** that this is the trigger point for security work before proceeding. Specifically:
- AsyncStorage data is plaintext — needs encryption before cloud sync
- Cache temp files are unencrypted — needs unique UUID filenames + cleanup
- URI validation in document.tsx needs hardening before multi-user scenarios
- `react-native-dotenv` should be removed before any API keys are introduced

One safe rule already agreed upon: never store API keys in code.
