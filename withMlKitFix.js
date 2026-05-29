const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withMlKitFix(config) {
  return withAndroidManifest(config, config => {
    const app = config.modResults.manifest.application[0];

    app["meta-data"] = app["meta-data"] || [];

    app["meta-data"].push({
      $: {
        "android:name": "com.google.mlkit.vision.DEPENDENCIES",
        "android:value": "face,barcode_ui",
        "tools:replace": "android:value",
      },
    });

    return config;
  });
};