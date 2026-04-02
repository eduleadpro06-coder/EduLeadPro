export default {
  expo: {
    name: 'Bloomdale Connect',
    slug: 'yonerra',
    version: '2.2.0',
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    updates: {
      enabled: false,
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
      versionCode: 5,
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
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      wsUrl: process.env.EXPO_PUBLIC_WS_URL,
      olaMapsApiKey: process.env.EXPO_PUBLIC_OLA_MAPS_KEY,
      eas: {
        projectId: '30dace9c-63f8-4c50-8337-0a177603ecd1',
      },
    },
    owner: 'gauravkachwaha',
    scheme: 'bloomdale',
  },
};
