const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Permanent Fix for 16KB Page Size Alignment (Android 15+ Requirement)
 * This plugin forces NDK 27, enables 16KB alignment flags, and ensures modern packaging.
 */
module.exports = function with16KBAlignment(config) {
  // 1. Force NDK 27 in the root build.gradle (Project level)
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const contents = config.modResults.contents;
      if (contents.includes('ndkVersion =')) {
        config.modResults.contents = contents.replace(
          /ndkVersion = .*/g,
          'ndkVersion = "27.1.12297006"'
        );
      } else {
        config.modResults.contents = contents.replace(
          /ext \{/,
          'ext {\n        ndkVersion = "27.1.12297006"'
        );
      }
    }
    return config;
  });

  // 2. Add Alignment and Packaging flags in app/build.gradle (App level)
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // Enable pageAlign16k in the android block (Supported in AGP 8.3+)
      if (!contents.includes('pageAlign16k')) {
        contents = contents.replace(
          /android \{/,
          'android {\n    // Force 16KB alignment for Google Play compliance\n    pageAlign16k = true'
        );
      }

      // Ensure useLegacyPackaging is false (Supports 16KB page sizes)
      // We apply it to both 'packaging' and 'packagingOptions' for compatibility across Gradle versions
      const packagingPatch = `
    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }
    packagingOptions {
        jniLibs {
            useLegacyPackaging = false
        }
    }
`;
      if (!contents.includes('useLegacyPackaging = false')) {
        contents = contents.replace(
          /android \{/,
          `android {${packagingPatch}`
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
};
