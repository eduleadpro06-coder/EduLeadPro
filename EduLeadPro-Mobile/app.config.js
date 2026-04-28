export default {
  expo: {
    name: 'Bloomdale Connect',
    slug: 'yonerra',
    version: '2.2.8',
    orientation: 'default',
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
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      label: 'Bloomdale',
      package: 'com.bloomdale.app',
      softwareKeyboardLayoutMode: 'resize',
      resizeableActivity: true,
      versionCode: 17,
      permissions: [],
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
      './plugins/withNdkVersion.js',
      [
        './plugins/withBlockedPermissions.js',
        [
          'android.permission.READ_MEDIA_IMAGES',
          'android.permission.READ_MEDIA_VIDEO',
          'android.permission.READ_MEDIA_AUDIO',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.ACCESS_MEDIA_LOCATION',
        ],
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
