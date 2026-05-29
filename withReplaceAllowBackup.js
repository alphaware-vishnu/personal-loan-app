const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withReplaceAllowBackup(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure tools namespace exists
    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] =
      manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";

    const application = manifest.application?.[0];

    if (application) {
      // Existing allowBackup/theme logic
      const existingReplace = application.$["tools:replace"];
      const requiredReplacements = [
        "android:allowBackup",
        "android:theme",
      ];

      if (existingReplace) {
        const replacements = existingReplace
          .split(",")
          .map((item) => item.trim());

        requiredReplacements.forEach((item) => {
          if (!replacements.includes(item)) {
            replacements.push(item);
          }
        });

        application.$["tools:replace"] = replacements.join(",");
      } else {
        application.$["tools:replace"] =
          requiredReplacements.join(",");
      }

      // ML Kit conflict fix
      application["meta-data"] = application["meta-data"] || [];

      // Remove existing entries if present
      application["meta-data"] = application["meta-data"].filter(
        (item) =>
          item.$?.["android:name"] !==
          "com.google.mlkit.vision.DEPENDENCIES"
      );

      application["meta-data"].push({
        $: {
          "android:name":
            "com.google.mlkit.vision.DEPENDENCIES",
          "android:value": "face,barcode_ui",
          "tools:replace": "android:value",
        },
      });
    }

    return config;
  });
};