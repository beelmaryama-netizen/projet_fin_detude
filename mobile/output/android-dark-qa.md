# Android native validation

Validated on Medium_Phone_API_36.1 in Expo Go SDK 57 through the existing Metro tunnel on October 7, 2026.

- ADMIN login and MFA: passed.
- Navy dashboard, four metrics, charts, quick actions, and fixed bottom navigation: passed visual inspection.
- New requests metric: opened the exact two-request subset.
- Request details and Analyser demonstration notice: passed.
- Period picker: changing week to month updated offers from 0 to 1.
- Offer and planning previews: passed; planning link opened the confirmed reservation.
- All four bottom tabs: passed, including the honest employees placeholder.
- ReactNativeJS warning/error and AndroidRuntime error logs: empty.

Final home screenshot: `previews/employer-dashboard-dark-android.png`; captured after an explicit reload of the final source (32 px maximum chart bars verified). All four quick action cards are visible. Detail screenshot: `previews/employer-request-dark-android.png`.

Expo Go's floating Tools control appears over the app notification icon in the native screenshots; it belongs to Expo Go. Fast Refresh/devtools connection showed an Expo CLI warning while using its inspector, so an explicit reload was used to verify the final source.

Emulator stopped after validation. Metro was left running and was not restarted.
