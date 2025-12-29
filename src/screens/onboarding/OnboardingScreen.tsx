import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useGoogleAuth } from '../../services/auth';
import { useUserStore } from '../../services/store';

import WelcomeScreen from './WelcomeScreen';
import TrackExpensesScreen from './TrackExpensesScreen';
import BudgetsGoalsScreen from './BudgetsGoalsScreen';
import GetStartedScreen from './GetStartedScreen';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'riyalmind_onboarding_completed';

export default function OnboardingScreen() {
  const router = useRouter();
  const { signIn } = useGoogleAuth();
  const { setUser } = useUserStore();
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToStep = (step: number) => {
    Animated.spring(slideAnim, {
      toValue: -step * width,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      animateToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateToStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Mark onboarding as completed
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    router.replace('/login');
  };

  const handleGoogleSignIn = async () => {
    const user = await signIn();
    if (user) {
      setUser(user);
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.slidesContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.slide}>
          <WelcomeScreen onNext={handleNext} />
        </View>
        <View style={styles.slide}>
          <TrackExpensesScreen onNext={handleNext} onBack={handleBack} />
        </View>
        <View style={styles.slide}>
          <BudgetsGoalsScreen onNext={handleNext} onBack={handleBack} />
        </View>
        <View style={styles.slide}>
          <GetStartedScreen
            onComplete={handleComplete}
            onBack={handleBack}
            onGoogleSignIn={handleGoogleSignIn}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  slidesContainer: {
    flexDirection: 'row',
    width: width * 4,
  },
  slide: {
    width,
    flex: 1,
  },
});

// Helper function to check if onboarding is completed
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// Helper function to reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
  await SecureStore.deleteItemAsync(ONBOARDING_KEY);
}
