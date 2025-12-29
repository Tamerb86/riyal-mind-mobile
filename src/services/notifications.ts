import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

const PUSH_TOKEN_KEY = 'riyalmind_push_token';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'budget_alert' | 'goal_progress' | 'expense_reminder' | 'bill_due' | 'weekly_report' | 'general';
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Register for push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    // Store token locally
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token.data);

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'الإشعارات العامة',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });

      await Notifications.setNotificationChannelAsync('budget_alerts', {
        name: 'تنبيهات الميزانية',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'التذكيرات',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#3B82F6',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to server
 */
export async function savePushTokenToServer(token: string): Promise<boolean> {
  try {
    const response = await api.post('/notifications/register-device', {
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName || 'Unknown',
    });
    return response.success;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
}

/**
 * Get stored push token
 */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  notification: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const channelId = getChannelForType(notification.type);

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: { type: notification.type, ...notification.data },
      sound: true,
      badge: 1,
    },
    trigger: trigger || null, // null = immediate
  });
}

/**
 * Schedule budget alert notification
 */
export async function scheduleBudgetAlert(
  budgetName: string,
  percentage: number,
  remaining: number
): Promise<string> {
  let title = '';
  let body = '';

  if (percentage >= 100) {
    title = '🚨 تجاوزت الميزانية!';
    body = `تجاوزت ميزانية "${budgetName}"`;
  } else if (percentage >= 90) {
    title = '⚠️ تحذير الميزانية';
    body = `وصلت لـ ${percentage}% من ميزانية "${budgetName}". متبقي ${remaining} ر.س`;
  } else if (percentage >= 75) {
    title = '📊 تنبيه الميزانية';
    body = `استهلكت ${percentage}% من ميزانية "${budgetName}"`;
  }

  return scheduleLocalNotification({
    type: 'budget_alert',
    title,
    body,
    data: { budgetName, percentage, remaining },
  });
}

/**
 * Schedule goal progress notification
 */
export async function scheduleGoalProgress(
  goalName: string,
  percentage: number,
  remaining: number
): Promise<string> {
  let title = '';
  let body = '';

  if (percentage >= 100) {
    title = '🎉 مبروك! حققت هدفك';
    body = `أكملت هدف "${goalName}" بنجاح!`;
  } else if (percentage >= 75) {
    title = '🎯 اقتربت من هدفك!';
    body = `وصلت لـ ${percentage}% من هدف "${goalName}". متبقي ${remaining} ر.س`;
  } else if (percentage >= 50) {
    title = '💪 نصف الطريق!';
    body = `أكملت ${percentage}% من هدف "${goalName}"`;
  }

  return scheduleLocalNotification({
    type: 'goal_progress',
    title,
    body,
    data: { goalName, percentage, remaining },
  });
}

/**
 * Schedule bill reminder
 */
export async function scheduleBillReminder(
  billName: string,
  amount: number,
  dueDate: Date
): Promise<string> {
  const trigger: Notifications.NotificationTriggerInput = {
    date: new Date(dueDate.getTime() - 24 * 60 * 60 * 1000), // 1 day before
  };

  return scheduleLocalNotification(
    {
      type: 'bill_due',
      title: '📅 تذكير بموعد الدفع',
      body: `غداً موعد دفع "${billName}" بمبلغ ${amount} ر.س`,
      data: { billName, amount, dueDate: dueDate.toISOString() },
    },
    trigger
  );
}

/**
 * Schedule daily expense reminder
 */
export async function scheduleDailyReminder(hour: number = 21): Promise<string> {
  const trigger: Notifications.NotificationTriggerInput = {
    hour,
    minute: 0,
    repeats: true,
  };

  return scheduleLocalNotification(
    {
      type: 'expense_reminder',
      title: '📝 سجل مصاريفك',
      body: 'لا تنسَ تسجيل مصاريف اليوم!',
    },
    trigger
  );
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get Android channel for notification type
 */
function getChannelForType(type: NotificationData['type']): string {
  switch (type) {
    case 'budget_alert':
      return 'budget_alerts';
    case 'bill_due':
    case 'expense_reminder':
      return 'reminders';
    default:
      return 'default';
  }
}

/**
 * Initialize notifications on app start
 */
export async function initializeNotifications(): Promise<void> {
  // Register for push notifications
  const token = await registerForPushNotifications();
  
  if (token) {
    // Save token to server
    await savePushTokenToServer(token);
  }
}
