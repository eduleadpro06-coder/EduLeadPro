export default {
  expo: {
    name: 'Bloomdale Connect',
    slug: 'yonerra',
    version: '2.2.5',
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    updates: {
      enabled: true,
      url: 'https://u.expo.dev/76a4a40f-0830-4dfa-9e16-a82b76bb5b8d',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.bloomdale.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/logo.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.bloomdale.app',
      softwareKeyboardLayoutMode: 'resize',
      versionCode: 10,
      permissions: [
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
        'READ_MEDIA_VIDEO',
        'READ_MEDIA_AUDIO'
      ],
    },
    web: {
      favicon: './assets/logo.png',
    },
    plugins: [
      'expo-router',
      'expo-sqlite',
      'expo-font',
      'expo-secure-store',
      'expo-location',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow Bloomdale Connect to access camera for attendance',
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow Bloomdale Connect to access your photos',
          savePhotosPermission: 'Allow Bloomdale Connect to save photos to your library',
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            pageAlign16k: true
          }
        }
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      wsUrl: process.env.EXPO_PUBLIC_WS_URL,
      olaMapsApiKey: process.env.EXPO_PUBLIC_OLA_MAPS_KEY,
      eas: {
        projectId: '76a4a40f-0830-4dfa-9e16-a82b76bb5b8d',
      },
    },
    owner: 'educonnect06',
    scheme: 'bloomdale',
  },
};
