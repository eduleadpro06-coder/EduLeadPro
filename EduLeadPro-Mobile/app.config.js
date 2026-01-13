export default {
  expo: {
    name: 'Yonerra',
    slug: 'yonerra',
    version: '2.0.0',
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yonerra.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/logo.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.yonerra.app',
      softwareKeyboardLayoutMode: 'resize',
      versionCode: 3,
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
          cameraPermission: 'Allow Yonerra to access camera for attendance',
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
        projectId: 'f302c7c0-8e3c-4bb8-b324-e9973c9a8657',
      },
    },
    owner: 'gauravkachwaha',
    scheme: 'yonerra',
  },
};
