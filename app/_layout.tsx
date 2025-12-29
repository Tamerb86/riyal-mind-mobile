import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useUserStore } from '../src/services/store';
import { initializeNotifications } from '../src/services/notifications';

// Enable RTL for Arabic
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'riyalmind_onboarding_completed';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useUserStore();
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  const [fontsLoaded] = useFonts({
    // Add custom Arabic fonts here if needed
  });

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
        setHasCompletedOnboarding(value === 'true');
      } catch {
        setHasCompletedOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (hasCompletedOnboarding === null || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';

    // If onboarding not completed, go to onboarding
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    }
    // If onboarding completed but not logged in, go to login
    else if (hasCompletedOnboarding && !user && !inLogin && !inOnboarding) {
      router.replace('/login');
    }
    // If logged in and trying to access auth screens, go to main app
    else if (user && (inLogin || inOnboarding)) {
      router.replace('/(tabs)' as any);
    }

    setIsReady(true);
  }, [hasCompletedOnboarding, user, segments, fontsLoaded]);

  useEffect(() => {
    if (isReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isReady, fontsLoaded]);

  if (!fontsLoaded || hasCompletedOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#059669' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
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
          {/* Onboarding */}
          <Stack.Screen 
            name="onboarding" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
            }} 
          />
          
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
