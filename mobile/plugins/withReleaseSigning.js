const { withAppBuildGradle, withGradleProperties } = require("@expo/config-plugins");

/**
 * Applied on every `expo prebuild` (the android/ folder is generated, not committed):
 * - signs the release build with the key listed in signing.properties, which lives OUTSIDE the repository
 *   (default D:/tudo/android-signing/signing.properties, override with the SIGNING_PROPERTIES variable);
 * - turns on code and resource shrinking for release;
 * - builds only the ABIs real phones use (arm64-v8a, armeabi-v7a).
 */
module.exports = function withReleaseSigning(config) {
  config = withAppBuildGradle(config, (mod) => {
    let src = mod.modResults.contents;
    if (!src.includes("releaseProps")) {
      src = src.replace(
        "    signingConfigs {\n        debug {",
        [
          "    def releaseProps = new Properties()",
          "    def releaseFile = file(System.getenv('SIGNING_PROPERTIES') ?: 'D:/tudo/android-signing/signing.properties')",
          "    if (releaseFile.exists()) releaseFile.withInputStream { releaseProps.load(it) }",
          "    signingConfigs {",
          "        if (releaseFile.exists()) {",
          "            release {",
          "                storeFile file(releaseProps['storeFile'])",
          "                storePassword releaseProps['storePassword']",
          "                keyAlias releaseProps['keyAlias']",
          "                keyPassword releaseProps['keyPassword']",
          "            }",
          "        }",
          "        debug {",
        ].join("\n"),
      );
      src = src.replace(
        "            signingConfig signingConfigs.debug\n            def enableShrinkResources",
        "            signingConfig releaseFile.exists() ? signingConfigs.release : signingConfigs.debug\n            def enableShrinkResources",
      );
    }
    mod.modResults.contents = src;
    return mod;
  });

  return withGradleProperties(config, (mod) => {
    const set = (key, value) => {
      const found = mod.modResults.find((item) => item.type === "property" && item.key === key);
      if (found) found.value = value; else mod.modResults.push({ type: "property", key, value });
    };
    // The Kotlin symbol processors of expo-updates and expo-iap run out of metaspace with the 512 MB default.
    set("org.gradle.jvmargs", "-Xmx4096m -XX:MaxMetaspaceSize=1536m");
    // Parallel Kotlin symbol processing was flaky on this machine (NoClassDefFoundError in KSP); sequential is slower but reliable.
    set("org.gradle.parallel", "false");
    set("kotlin.daemon.jvmargs", "-Xmx3072m");
    set("reactNativeArchitectures", "armeabi-v7a,arm64-v8a");
    set("android.enableMinifyInReleaseBuilds", "true");
    set("android.enableShrinkResourcesInReleaseBuilds", "true");
    return mod;
  });
};
