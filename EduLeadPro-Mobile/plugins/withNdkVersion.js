const { withAppBuildGradle, withProjectBuildGradle, withGradleProperties, withAndroidManifest } = require('@expo/config-plugins');

module.exports = function with16KBAlignment(config) {
  // 1. Force NDK 27 in app build.gradle (more reliable for alignment)
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // Force NDK version 27
      if (contents.includes('ndkVersion')) {
        contents = contents.replace(/ndkVersion\s+.*/, 'ndkVersion "27.1.12297006"');
      } else {
        contents = contents.replace(/android\s*\{/, 'android {\n    ndkVersion "27.1.12297006"');
      }

      // Ensure packaging block for 16KB alignment
      const packagingBlock = `
    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }
`;
      if (!contents.includes('useLegacyPackaging = false')) {
        contents = contents.replace(/android\s*\{/, `android {${packagingBlock}`);
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  // 2. Explicitly set extractNativeLibs="false" in AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;
    const mainApplication = androidManifest.application[0];
    mainApplication.$['android:extractNativeLibs'] = 'false';
    return config;
  });

  // 3. Set required Gradle properties for 16KB support
  config = withGradleProperties(config, (config) => {
    const props = config.modResults;

    const requiredProps = [
      { key: 'android.use16KPageSize', value: 'true' },
      { key: 'expo.useLegacyPackaging', value: 'false' }
    ];

    requiredProps.forEach(({ key, value }) => {
      const index = props.findIndex((p) => p.type === 'property' && p.key === key);
      if (index > -1) {
        props[index].value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    });

    config.modResults = props;
    return config;
  });

  return config;
};

