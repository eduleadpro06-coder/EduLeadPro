/**
 * useResponsive Hook
 * 
 * Generic responsive layout hook that works across all Android/iOS devices.
 * Uses useWindowDimensions (reactive) instead of Dimensions.get() (stale).
 * Provides safe area insets for proper padding on gesture-bar and notched devices.
 */

import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useResponsive() {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    return {
        // Reactive screen dimensions (updates on rotation, foldable unfold, etc.)
        width,
        height,

        // Safe area insets (accounts for notches, gesture bars, status bars)
        insets,

        // Device size breakpoints
        isSmallDevice: width < 375,   // iPhone SE, older Androids
        isMediumDevice: width >= 375 && width < 428,
        isLargeDevice: width >= 428,  // iPhone Pro Max, large Androids

        // Safe bottom padding — ensures content is never hidden behind
        // Android gesture bar, iOS home indicator, or navigation bar.
        // Minimum 20px even if no inset reported (some launchers don't report it).
        bottomPadding: Math.max(insets.bottom + 16, 24),

        // Safe top padding for custom headers outside SafeAreaView
        topPadding: insets.top,
    };
}

export default useResponsive;
