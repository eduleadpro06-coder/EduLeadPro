import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function GateLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Gate Dashboard',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="scanner"
                options={{
                    title: 'QR Scanner',
                }}
            />
            <Stack.Screen
                name="visitor-form"
                options={{
                    title: 'Visitor Entry',
                }}
            />
            <Stack.Screen
                name="history"
                options={{
                    title: 'Today\'s Logs',
                }}
            />
        </Stack>
    );
}
