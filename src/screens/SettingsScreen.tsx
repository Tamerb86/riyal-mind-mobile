import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../services/store';
import { authService } from '../services/auth';

interface SettingItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  type: 'link' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, clearUser } = useUserStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await authService.signOut();
            clearUser();
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب',
      'هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف الحساب',
          style: 'destructive',
          onPress: () => {
            Alert.alert('تم', 'سيتم حذف حسابك خلال 30 يوم');
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const settingSections = [
    {
      title: 'الحساب',
      items: [
        {
          id: 'profile',
          icon: 'person-outline',
          iconColor: '#3B82F6',
          title: 'الملف الشخصي',
          subtitle: user?.email,
          type: 'link' as const,
          onPress: () => router.push('/profile' as any),
        },
        {
          id: 'subscription',
          icon: 'diamond-outline',
          iconColor: '#8B5CF6',
          title: 'الاشتراك',
          subtitle: user?.subscription === 'FREE' ? 'مجاني' : 'مميز',
          type: 'link' as const,
          onPress: () => router.push('/subscription' as any),
        },
      ],
    },
    {
      title: 'التفضيلات',
      items: [
        {
          id: 'notifications',
          icon: 'notifications-outline',
          iconColor: '#F59E0B',
          title: 'الإشعارات',
          subtitle: 'تنبيهات الميزانية والتذكيرات',
          type: 'toggle' as const,
          value: notifications,
          onPress: () => {
            Haptics.selectionAsync();
            setNotifications(!notifications);
          },
        },
        {
          id: 'darkMode',
          icon: 'moon-outline',
          iconColor: '#6366F1',
          title: 'الوضع الداكن',
          type: 'toggle' as const,
          value: darkMode,
          onPress: () => {
            Haptics.selectionAsync();
            setDarkMode(!darkMode);
          },
        },
        {
          id: 'biometric',
          icon: 'finger-print-outline',
          iconColor: '#10B981',
          title: 'البصمة / Face ID',
          subtitle: 'تسجيل دخول سريع وآمن',
          type: 'toggle' as const,
          value: biometric,
          onPress: () => {
            Haptics.selectionAsync();
            setBiometric(!biometric);
          },
        },
        {
          id: 'currency',
          icon: 'cash-outline',
          iconColor: '#059669',
          title: 'العملة',
          subtitle: 'ريال سعودي (ر.س)',
          type: 'link' as const,
          onPress: () => {},
        },
        {
          id: 'language',
          icon: 'language-outline',
          iconColor: '#EC4899',
          title: 'اللغة',
          subtitle: 'العربية',
          type: 'link' as const,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'البيانات',
      items: [
        {
          id: 'export',
          icon: 'download-outline',
          iconColor: '#14B8A6',
          title: 'تصدير البيانات',
          subtitle: 'Excel أو PDF',
          type: 'link' as const,
          onPress: () => router.push('/export' as any),
        },
        {
          id: 'backup',
          icon: 'cloud-upload-outline',
          iconColor: '#3B82F6',
          title: 'النسخ الاحتياطي',
          subtitle: 'متصل بـ Google Drive',
          type: 'link' as const,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'الدعم',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          iconColor: '#6B7280',
          title: 'مركز المساعدة',
          type: 'link' as const,
          onPress: () => openLink('https://riyalmind.com/help'),
        },
        {
          id: 'contact',
          icon: 'mail-outline',
          iconColor: '#EF4444',
          title: 'تواصل معنا',
          type: 'link' as const,
          onPress: () => openLink('mailto:support@riyalmind.com'),
        },
        {
          id: 'rate',
          icon: 'star-outline',
          iconColor: '#F59E0B',
          title: 'قيّم التطبيق',
          type: 'link' as const,
          onPress: () => {},
        },
        {
          id: 'share',
          icon: 'share-social-outline',
          iconColor: '#10B981',
          title: 'شارك التطبيق',
          type: 'link' as const,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'قانوني',
      items: [
        {
          id: 'privacy',
          icon: 'shield-checkmark-outline',
          iconColor: '#6366F1',
          title: 'سياسة الخصوصية',
          type: 'link' as const,
          onPress: () => openLink('https://riyalmind.com/privacy'),
        },
        {
          id: 'terms',
          icon: 'document-text-outline',
          iconColor: '#8B5CF6',
          title: 'شروط الاستخدام',
          type: 'link' as const,
          onPress: () => openLink('https://riyalmind.com/terms'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={[styles.settingIcon, { backgroundColor: item.iconColor + '20' }]}>
        <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.settingSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.type === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={item.onPress}
          trackColor={{ false: '#D1D5DB', true: '#D1FAE5' }}
          thumbColor={item.value ? '#10B981' : '#9CA3AF'}
        />
      ) : (
        <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الإعدادات</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) || user?.email?.charAt(0) || '؟'}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/profile' as any)}
          >
            <Ionicons name="create-outline" size={20} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Logout & Delete */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>حذف الحساب</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>ريال مايند</Text>
          <Text style={styles.appVersion}>الإصدار 1.0.0</Text>
          <Text style={styles.copyright}>© 2025 RiyalMind</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  userInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'right',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'right',
  },
  dangerSection: {
    marginTop: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteText: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 8,
  },
});
