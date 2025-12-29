import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  getBiometricStatus,
  enableBiometricAuth,
  disableBiometricAuth,
  getBiometricTypeName,
  getBiometricIcon,
  BiometricStatus,
} from '../services/biometric';
import { authAPI } from '../services/api';

export default function BiometricSettings() {
  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const biometricStatus = await getBiometricStatus();
      setStatus(biometricStatus);
    } catch (error) {
      console.error('Error loading biometric status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (!status?.isAvailable) {
      Alert.alert(
        'غير متاح',
        'البصمة غير متاحة على هذا الجهاز أو لم يتم إعدادها',
        [{ text: 'حسناً' }]
      );
      return;
    }

    setToggling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (value) {
        // Enable biometric auth
        const token = await authAPI.getToken();
        if (!token) {
          Alert.alert('خطأ', 'يرجى تسجيل الدخول أولاً');
          setToggling(false);
          return;
        }

        const success = await enableBiometricAuth(token);
        if (success) {
          setStatus((prev) => prev ? { ...prev, isEnabled: true, hasCredentials: true } : null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('تم', 'تم تفعيل تسجيل الدخول بالبصمة');
        } else {
          Alert.alert('فشل', 'لم يتم تفعيل البصمة');
        }
      } else {
        // Disable biometric auth
        const success = await disableBiometricAuth();
        if (success) {
          setStatus((prev) => prev ? { ...prev, isEnabled: false, hasCredentials: false } : null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('تم', 'تم إلغاء تسجيل الدخول بالبصمة');
        }
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تغيير الإعدادات');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#10B981" />
      </View>
    );
  }

  if (!status) {
    return null;
  }

  const iconName = getBiometricIcon(status.biometricType) as any;
  const typeName = getBiometricTypeName(status.biometricType);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[
          styles.iconContainer,
          status.isEnabled ? styles.iconEnabled : styles.iconDisabled
        ]}>
          <Ionicons
            name={iconName}
            size={24}
            color={status.isEnabled ? '#10B981' : '#9CA3AF'}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>تسجيل الدخول بالبصمة</Text>
          <Text style={styles.subtitle}>
            {status.isAvailable
              ? `استخدم ${typeName} لتسجيل الدخول بسرعة`
              : 'غير متاح على هذا الجهاز'}
          </Text>
        </View>
        {toggling ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : (
          <Switch
            value={status.isEnabled}
            onValueChange={handleToggle}
            disabled={!status.isAvailable}
            trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
            thumbColor={status.isEnabled ? '#10B981' : '#F3F4F6'}
            ios_backgroundColor="#E5E7EB"
          />
        )}
      </View>

      {!status.isAvailable && (
        <View style={styles.warningContainer}>
          <Ionicons name="information-circle" size={16} color="#F59E0B" />
          <Text style={styles.warningText}>
            قم بإعداد البصمة في إعدادات الجهاز لتفعيل هذه الميزة
          </Text>
        </View>
      )}

      {status.isEnabled && (
        <View style={styles.infoContainer}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.infoText}>
            حسابك محمي بالبصمة
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconEnabled: {
    backgroundColor: '#D1FAE5',
  },
  iconDisabled: {
    backgroundColor: '#F3F4F6',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    textAlign: 'right',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    textAlign: 'right',
  },
});
