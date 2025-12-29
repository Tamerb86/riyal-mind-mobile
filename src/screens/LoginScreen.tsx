import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useGoogleAuth } from '../services/auth';
import { useUserStore } from '../services/store';
import {
  getBiometricStatus,
  getCredentialsWithBiometrics,
  getBiometricTypeName,
  getBiometricIcon,
  BiometricStatus,
} from '../services/biometric';
import { authAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error, isReady } = useGoogleAuth();
  const { setUser } = useUserStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      const status = await getBiometricStatus();
      setBiometricStatus(status);
      
      // Auto-prompt biometric if enabled
      if (status.isEnabled && status.hasCredentials) {
        handleBiometricLogin();
      }
    } catch (error) {
      console.error('Error checking biometric:', error);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setLocalError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getCredentialsWithBiometrics();
      
      if (token) {
        // Verify token is still valid
        const profile = await authAPI.getProfile();
        
        if (profile) {
          setUser(profile);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/(tabs)' as any);
        } else {
          setLocalError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        }
      }
    } catch (err) {
      console.error('Biometric login error:', err);
      setLocalError('فشل تسجيل الدخول بالبصمة');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalError(null);
    
    try {
      const user = await signIn();
      if (user) {
        setUser(user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)' as any);
      }
    } catch (err) {
      setLocalError('حدث خطأ أثناء تسجيل الدخول');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const biometricIconName = biometricStatus 
    ? getBiometricIcon(biometricStatus.biometricType) as any
    : 'finger-print';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#059669', '#047857', '#065F46']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <SafeAreaView style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>💰</Text>
          </View>
          <Text style={styles.appName}>ريال مايند</Text>
          <Text style={styles.appNameEn}>RiyalMind</Text>
          <Text style={styles.tagline}>إدارة ذكية لمصاريفك</Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="wallet-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>تتبع المصاريف</Text>
              <Text style={styles.featureDesc}>سجل مصاريفك بسهولة</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="pie-chart-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>تحليلات ذكية</Text>
              <Text style={styles.featureDesc}>افهم عادات إنفاقك</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="flag-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>أهداف ادخارية</Text>
              <Text style={styles.featureDesc}>حقق أحلامك المالية</Text>
            </View>
          </View>
        </View>

        {/* Login Section */}
        <View style={styles.loginSection}>
          {(error || localError) && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error || localError}</Text>
            </View>
          )}

          {/* Biometric Login Button */}
          {biometricStatus?.isEnabled && biometricStatus?.hasCredentials && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={biometricLoading}
            >
              {biometricLoading ? (
                <ActivityIndicator color="#10B981" />
              ) : (
                <>
                  <Ionicons name={biometricIconName} size={32} color="#10B981" />
                  <Text style={styles.biometricText}>
                    تسجيل الدخول بـ {getBiometricTypeName(biometricStatus.biometricType)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Divider */}
          {biometricStatus?.isEnabled && biometricStatus?.hasCredentials && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {/* Google Login Button */}
          <TouchableOpacity
            style={[styles.googleButton, (!isReady || isLoading) && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={!isReady || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#374151" />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>تسجيل الدخول بـ Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            بتسجيل الدخول، أنت توافق على{' '}
            <Text style={styles.termsLink}>شروط الاستخدام</Text>
            {' '}و{' '}
            <Text style={styles.termsLink}>سياسة الخصوصية</Text>
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>مصمم للسوق السعودي 🇸🇦</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#059669',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: 100,
    left: -50,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: height * 0.4,
    right: -30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.06,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 50,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appNameEn: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  featuresSection: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 24,
    marginVertical: 16,
  },
  featureItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  featureText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginSection: {
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    marginRight: 8,
    flex: 1,
    textAlign: 'right',
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  biometricText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
