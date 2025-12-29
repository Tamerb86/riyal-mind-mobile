import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  scheduleDailyReminder,
  cancelAllNotifications,
  getScheduledNotifications,
} from '../services/notifications';
import * as SecureStore from 'expo-secure-store';

const NOTIFICATION_SETTINGS_KEY = 'riyalmind_notification_settings';

interface NotificationPreferences {
  pushEnabled: boolean;
  budgetAlerts: boolean;
  goalProgress: boolean;
  billReminders: boolean;
  dailyReminder: boolean;
  weeklyReport: boolean;
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  budgetAlerts: true,
  goalProgress: true,
  billReminders: true,
  dailyReminder: false,
  weeklyReport: true,
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await SecureStore.getItemAsync(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newPreferences: NotificationPreferences) => {
    try {
      await SecureStore.setItemAsync(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newPreferences)
      );
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === 'pushEnabled' && value) {
      // Request permissions if enabling push
      const token = await registerForPushNotifications();
      if (!token) {
        Alert.alert(
          'الإشعارات غير مفعلة',
          'يرجى تفعيل الإشعارات من إعدادات الجهاز',
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'فتح الإعدادات', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }

    if (key === 'dailyReminder') {
      if (value) {
        await scheduleDailyReminder(21); // 9 PM
        Alert.alert('تم', 'سيتم تذكيرك يومياً الساعة 9 مساءً');
      } else {
        // Cancel daily reminder
        const scheduled = await getScheduledNotifications();
        const dailyReminders = scheduled.filter(
          (n) => n.content.data?.type === 'expense_reminder'
        );
        for (const reminder of dailyReminders) {
          await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
        }
      }
    }

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await saveSettings(newPreferences);
  };

  const handleDisableAll = async () => {
    Alert.alert(
      'إيقاف جميع الإشعارات',
      'هل أنت متأكد من إيقاف جميع الإشعارات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إيقاف',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            const newPreferences: NotificationPreferences = {
              pushEnabled: false,
              budgetAlerts: false,
              goalProgress: false,
              billReminders: false,
              dailyReminder: false,
              weeklyReport: false,
            };
            setPreferences(newPreferences);
            await saveSettings(newPreferences);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#10B981" />
      </View>
    );
  }

  const notificationItems = [
    {
      key: 'budgetAlerts' as const,
      icon: 'pie-chart',
      title: 'تنبيهات الميزانية',
      description: 'عند اقتراب أو تجاوز الميزانية',
      color: '#F59E0B',
    },
    {
      key: 'goalProgress' as const,
      icon: 'flag',
      title: 'تقدم الأهداف',
      description: 'عند تحقيق تقدم في أهدافك',
      color: '#10B981',
    },
    {
      key: 'billReminders' as const,
      icon: 'calendar',
      title: 'تذكير الفواتير',
      description: 'قبل موعد استحقاق الفواتير',
      color: '#3B82F6',
    },
    {
      key: 'dailyReminder' as const,
      icon: 'time',
      title: 'تذكير يومي',
      description: 'تذكير بتسجيل المصاريف مساءً',
      color: '#8B5CF6',
    },
    {
      key: 'weeklyReport' as const,
      icon: 'document-text',
      title: 'التقرير الأسبوعي',
      description: 'ملخص أسبوعي للمصاريف',
      color: '#EC4899',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Main Toggle */}
      <View style={styles.mainToggle}>
        <View style={styles.mainToggleContent}>
          <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="notifications" size={24} color="#10B981" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.mainTitle}>الإشعارات</Text>
            <Text style={styles.mainDescription}>
              {preferences.pushEnabled ? 'مفعّلة' : 'متوقفة'}
            </Text>
          </View>
          <Switch
            value={preferences.pushEnabled}
            onValueChange={(value) => handleToggle('pushEnabled', value)}
            trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
            thumbColor={preferences.pushEnabled ? '#10B981' : '#F3F4F6'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </View>

      {/* Permission Warning */}
      {permissionStatus === 'denied' && (
        <TouchableOpacity
          style={styles.warningContainer}
          onPress={() => Linking.openSettings()}
        >
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            الإشعارات معطلة. اضغط لفتح الإعدادات
          </Text>
          <Ionicons name="chevron-back" size={20} color="#F59E0B" />
        </TouchableOpacity>
      )}

      {/* Notification Types */}
      {preferences.pushEnabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أنواع الإشعارات</Text>
          
          {notificationItems.map((item) => (
            <View key={item.key} style={styles.notificationItem}>
              <View style={[styles.itemIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
              <Switch
                value={preferences[item.key]}
                onValueChange={(value) => handleToggle(item.key, value)}
                trackColor={{ false: '#E5E7EB', true: `${item.color}40` }}
                thumbColor={preferences[item.key] ? item.color : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          ))}
        </View>
      )}

      {/* Disable All Button */}
      {preferences.pushEnabled && (
        <TouchableOpacity style={styles.disableButton} onPress={handleDisableAll}>
          <Ionicons name="notifications-off" size={20} color="#EF4444" />
          <Text style={styles.disableButtonText}>إيقاف جميع الإشعارات</Text>
        </TouchableOpacity>
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
  mainToggle: {
    marginBottom: 16,
  },
  mainToggleContent: {
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
  textContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  mainDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    textAlign: 'right',
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'right',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
  },
  itemDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'right',
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  disableButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
});
