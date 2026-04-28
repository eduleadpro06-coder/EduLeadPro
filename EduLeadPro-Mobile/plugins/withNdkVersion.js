const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function with16KBAlignment(config) {
  // 1. Force NDK 27 in project build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = config.modResults.contents.replace(
        /ndkVersion = .*/g,
        'ndkVersion = "27.1.12297006"'
      );
    }
    return config;
  });

  // 2. Configure Packaging in app build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // Define the packaging block clearly
      const packagingBlock = `
    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }
`;
      
      // Inject it right after the android { line
      if (!contents.includes('useLegacyPackaging = false')) {
        contents = contents.replace(
          /android\s*\{/,
          `android {${packagingBlock}`
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
};
