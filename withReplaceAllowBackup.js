const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withReplaceAllowBackup(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    // 1. Ensure the tools namespace is present
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // 2. Access the <application> tag
    const application = manifest.application[0];
    if (application) {
      // 3. Add or update tools:replace
      const existingReplace = application.$['tools:replace'];
      const requiredReplacements = ['android:allowBackup', 'android:theme'];
      
      if (existingReplace) {
        const replacements = existingReplace
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        requiredReplacements.forEach((replacement) => {
          if (!replacements.includes(replacement)) {
            replacements.push(replacement);
          }
        });

        application.$['tools:replace'] = replacements.join(',');
      } else {
        application.$['tools:replace'] = requiredReplacements.join(',');
      }
    }

    return config;
  });
};
