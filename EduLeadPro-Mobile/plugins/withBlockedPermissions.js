/**
 * Custom Expo Config Plugin: withBlockedPermissions
 * 
 * Removes specified Android permissions from the manifest that are
 * auto-injected by other plugins (e.g., expo-media-library adds
 * READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, etc.) but are not required
 * by the app's actual usage pattern.
 * 
 * This is needed to comply with Google Play's photo and video
 * permissions policy when the app only uses the system photo picker
 * and saves photos to the gallery (no broad read access needed).
 */
const { withAndroidManifest } = require('@expo/config-plugins');

function withBlockedPermissions(config, blockedPermissions = []) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (manifest['uses-permission']) {
      const before = manifest['uses-permission'].length;
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (perm) => {
          const permName = perm.$?.['android:name'] || '';
          const blocked = blockedPermissions.includes(permName);
          if (blocked) {
            console.log(`[withBlockedPermissions] Removed: ${permName}`);
          }
          return !blocked;
        }
      );
      console.log(
        `[withBlockedPermissions] Filtered ${before - manifest['uses-permission'].length} permission(s)`
      );
    }

    return config;
  });
}

module.exports = withBlockedPermissions;
