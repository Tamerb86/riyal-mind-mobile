import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface GetStartedScreenProps {
  onComplete: () => void;
  onBack: () => void;
  onGoogleSignIn: () => Promise<void>;
}

export default function GetStartedScreen({ 
  onComplete, 
  onBack, 
  onGoogleSignIn 
}: GetStartedScreenProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      await onGoogleSignIn();
      onComplete();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#059669', '#047857', '#065F46']}
        style={styles.gradient}
      />
      
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      
      <SafeAreaView style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-forward" size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* Success Icon */}
        <View style={styles.iconSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text style={styles.title}>أنت جاهز!</Text>
          <Text style={styles.description}>
            سجّل دخولك الآن وابدأ رحلتك{'\n'}
            نحو إدارة مالية أفضل
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>بياناتك آمنة</Text>
              <Text style={styles.benefitDesc}>تشفير كامل لجميع بياناتك</Text>
            </View>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="sync" size={24} color="#10B981" />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>مزامنة تلقائية</Text>
              <Text style={styles.benefitDesc}>بياناتك متاحة على جميع أجهزتك</Text>
            </View>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="gift" size={24} color="#10B981" />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>مجاني بالكامل</Text>
              <Text style={styles.benefitDesc}>جميع الميزات متاحة مجاناً</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleSignIn}
            disabled={isLoading}
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

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>تخطي الآن</Text>
          </TouchableOpacity>
          
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
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
    bottom: 150,
    left: -50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  iconSection: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
  },
  benefits: {
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  benefitText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  benefitDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
});
