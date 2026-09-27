# Google Play release checklist

Verified on 27 September 2026 from official Android/Google Play documentation.

- New apps and updates submitted after 31 August 2026 must target Android 16 / API 36 or higher. Current project is API 35, so it is not yet ready for a new Play submission.
- Google Play accepts Android App Bundles and every upload needs a strictly increasing `versionCode`.
- Current supported Google Play Billing Library is 9.1.0. Billing Library 7 remains accepted only until 31 August 2026; this project must use 9.1.0 for a new release.
- The owner must create non-consumable one-time products in Play Console before real purchases can work: `remove_ads_lifetime` and `pro_lifetime`.
- Production signing key/password must be supplied by the owner through environment variables or untracked `keystore.properties`; never commit a keystore or password.

## Before creating an AAB

1. Install Android SDK Platform 36 and compile against it; regression-test target-36 behaviour.
2. Update `compileSdkVersion` and `targetSdkVersion` to 36 only after that platform is available.
3. Create the two products in Play Console, configure prices there, and test with licensed test accounts.
4. Configure Play App Signing and the upload key. Keep the upload key outside this repository.
5. Increment `versionCode`, set the final public `versionName`, build `bundleRelease`, and upload only the signed AAB.
6. Complete developer identity/package registration, Data safety, privacy policy, content rating and testing requirements in Play Console.

## Sources

- https://developer.android.com/google/play/requirements/target-sdk
- https://developer.android.com/google/play/billing/integrate
- https://developer.android.com/google/play/billing/release-notes
- https://support.google.com/googleplay/android-developer/answer/9859152
