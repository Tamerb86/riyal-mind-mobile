import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';

// Enable RTL for Arabic
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add custom Arabic fonts here if needed
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_left', // RTL animation
          }}
        >
          {/* Main Tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Auth Screens */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          
          {/* Modal Screens */}
          <Stack.Screen
            name="quick-add"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="scanner"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          
          {/* Feature Screens */}
          <Stack.Screen
            name="income"
            options={{
              headerShown: false,
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="budgets"
            options={{
              headerShown: false,
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="goals"
            options={{
              headerShown: false,
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="loans"
            options={{
              headerShown: false,
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="recurring"
            options={{
              headerShown: false,
              animation: 'slide_from_left',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
