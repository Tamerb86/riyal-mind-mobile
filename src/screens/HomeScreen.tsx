import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore, useExpensesStore, useIncomeStore, useAlertsStore } from '../services/store';
import { expensesAPI, incomeAPI, alertsAPI } from '../services/api';

const { width } = Dimensions.get('window');

// الفئات السريعة
const QUICK_ACTIONS = [
  { id: 'quick-add', icon: 'flash', label: 'إضافة سريعة', color: '#10B981', route: '/quick-add' },
  { id: 'budgets', icon: 'pie-chart', label: 'الميزانيات', color: '#3B82F6', route: '/budgets' },
  { id: 'goals', icon: 'flag', label: 'الأهداف', color: '#8B5CF6', route: '/goals' },
  { id: 'loans', icon: 'card', label: 'القروض', color: '#F59E0B', route: '/loans' },
];

// أيقونات الفئات
const CATEGORY_ICONS: Record<string, string> = {
  'طعام ومطاعم': '🍔',
  'بنزين': '⛽',
  'بقالة وتموينات': '🛒',
  'قهوة': '☕',
  'توصيل': '🛵',
  'مواصلات': '🚗',
  'فواتير': '📄',
  'تسوق': '🛍️',
  'ترفيه': '🎬',
  'صحة': '🏥',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { expenses, totalExpenses, setExpenses, setLoading: setExpensesLoading } = useExpensesStore();
  const { totalIncome, setIncomes, setLoading: setIncomeLoading } = useIncomeStore();
  const { alerts, setAlerts } = useAlertsStore();
  const [refreshing, setRefreshing] = useState(false);

  const balance = totalIncome - totalExpenses;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setExpensesLoading(true);
      setIncomeLoading(true);

      const [expensesRes, incomeRes, alertsRes] = await Promise.all([
        expensesAPI.getAll({ limit: 10 }),
        incomeAPI.getAll(),
        alertsAPI.getAll(),
      ]);

      setExpenses(expensesRes.expenses || []);
      setIncomes(incomeRes.incomes || []);
      setAlerts(alertsRes.alerts || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setExpensesLoading(false);
      setIncomeLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleQuickAction = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            {alerts.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{alerts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>الرصيد المتبقي</Text>
          <Text style={[styles.balanceAmount, balance < 0 && styles.negativeBalance]}>
            {formatCurrency(balance)} <Text style={styles.currency}>ر.س</Text>
          </Text>
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="arrow-down" size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>الدخل</Text>
                <Text style={styles.balanceItemValue}>{formatCurrency(totalIncome)}</Text>
              </View>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="arrow-up" size={16} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>المصاريف</Text>
                <Text style={styles.balanceItemValue}>{formatCurrency(totalExpenses)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.route)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تنبيهات</Text>
            <View style={styles.alertsContainer}>
              {alerts.slice(0, 2).map((alert) => (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    alert.priority === 'high' && styles.alertCardHigh,
                  ]}
                >
                  <Ionicons
                    name={alert.priority === 'high' ? 'warning' : 'information-circle'}
                    size={20}
                    color={alert.priority === 'high' ? '#EF4444' : '#F59E0B'}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>آخر المصاريف</Text>
            <TouchableOpacity onPress={() => router.push('/expenses' as any)}>
              <Text style={styles.seeAllButton}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.expensesList}>
            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>لا توجد مصاريف بعد</Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => router.push('/quick-add' as any)}
                >
                  <Text style={styles.emptyStateButtonText}>أضف أول مصروف</Text>
                </TouchableOpacity>
              </View>
            ) : (
              expenses.slice(0, 5).map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.expenseItem}
                  onPress={() => router.push(`/expense/${expense.id}` as any)}
                >
                  <View style={styles.expenseIcon}>
                    <Text style={styles.expenseIconText}>
                      {CATEGORY_ICONS[expense.category] || '📌'}
                    </Text>
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseCategory}>{expense.category}</Text>
                    <Text style={styles.expenseDescription}>
                      {expense.description || expense.category}
                    </Text>
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text style={styles.expenseAmount}>
                      -{formatCurrency(expense.amount)}
                    </Text>
                    <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Features Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>استكشف المزيد</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.featureCard, { backgroundColor: '#EFF6FF' }]}
              onPress={() => router.push('/weekly-report' as any)}
            >
              <Ionicons name="bar-chart" size={32} color="#3B82F6" />
              <Text style={styles.featureCardTitle}>التقرير الأسبوعي</Text>
              <Text style={styles.featureCardDescription}>تحليل مصاريفك</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.featureCard, { backgroundColor: '#F0FDF4' }]}
              onPress={() => router.push('/comparison' as any)}
            >
              <Ionicons name="git-compare" size={32} color="#10B981" />
              <Text style={styles.featureCardTitle}>المقارنة الشهرية</Text>
              <Text style={styles.featureCardDescription}>قارن إنفاقك</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.featureCard, { backgroundColor: '#FEF3C7' }]}
              onPress={() => router.push('/seasonal' as any)}
            >
              <Ionicons name="calendar" size={32} color="#F59E0B" />
              <Text style={styles.featureCardTitle}>ميزانية المواسم</Text>
              <Text style={styles.featureCardDescription}>رمضان والأعياد</Text>
            </TouchableOpacity>
          </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: '#10B981',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    marginTop: 8,
  },
  negativeBalance: {
    color: '#FEE2E2',
  },
  currency: {
    fontSize: 20,
    fontWeight: 'normal',
  },
  balanceDetails: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceItemLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  balanceDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'right',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  alertsContainer: {
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  alertCardHigh: {
    backgroundColor: '#FEE2E2',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  alertMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  expensesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseIconText: {
    fontSize: 20,
  },
  expenseDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  expenseDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  expenseDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptyStateButton: {
    marginTop: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featureCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  featureCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    textAlign: 'center',
  },
  featureCardDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
