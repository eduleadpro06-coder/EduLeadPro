const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withNdkVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      if (config.modResults.contents.includes('ndkVersion =')) {
        config.modResults.contents = config.modResults.contents.replace(
          /ndkVersion = .*/,
          'ndkVersion = "27.1.12297006"'
        );
      } else {
        // Fallback if not found
        config.modResults.contents = config.modResults.contents.replace(
          /ext \{/,
          'ext {\n        ndkVersion = "27.1.12297006"'
        );
      }
    }
    return config;
  });
};
