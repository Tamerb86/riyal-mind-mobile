import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { recurringAPI } from '../services/api';

// أنواع المصاريف المتكررة
const RECURRING_CATEGORIES = [
  { id: 'rent', label: 'إيجار', icon: '🏠', color: '#3B82F6' },
  { id: 'electricity', label: 'كهرباء', icon: '⚡', color: '#F59E0B' },
  { id: 'water', label: 'ماء', icon: '💧', color: '#06B6D4' },
  { id: 'internet', label: 'إنترنت', icon: '📶', color: '#8B5CF6' },
  { id: 'phone', label: 'جوال', icon: '📱', color: '#EC4899' },
  { id: 'insurance', label: 'تأمين', icon: '🛡️', color: '#10B981' },
  { id: 'gym', label: 'نادي رياضي', icon: '💪', color: '#EF4444' },
  { id: 'subscription', label: 'اشتراكات', icon: '📺', color: '#6366F1' },
  { id: 'other', label: 'أخرى', icon: '📋', color: '#6B7280' },
];

// فترات التكرار
const FREQUENCIES = [
  { id: 'daily', label: 'يومي' },
  { id: 'weekly', label: 'أسبوعي' },
  { id: 'monthly', label: 'شهري' },
  { id: 'yearly', label: 'سنوي' },
];

interface RecurringExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  isActive: boolean;
  autoAdd: boolean;
  notes?: string;
}

export default function RecurringScreen() {
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecurring, setNewRecurring] = useState({
    name: '',
    category: 'other',
    amount: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    autoAdd: true,
  });

  useEffect(() => {
    loadRecurring();
  }, []);

  const loadRecurring = async () => {
    try {
      setLoading(true);
      const response = await recurringAPI.getAll();
      setRecurring(response.recurring || []);
    } catch (error) {
      console.error('Error loading recurring:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecurring();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getCategory = (categoryId: string) => {
    return RECURRING_CATEGORIES.find((c) => c.id === categoryId) || RECURRING_CATEGORIES[RECURRING_CATEGORIES.length - 1];
  };

  const getFrequencyLabel = (frequency: string) => {
    return FREQUENCIES.find((f) => f.id === frequency)?.label || frequency;
  };

  const getDaysUntilNext = (nextDate: string) => {
    const today = new Date();
    const next = new Date(nextDate);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddRecurring = async () => {
    if (!newRecurring.name || !newRecurring.amount) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع البيانات المطلوبة');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await recurringAPI.create({
        name: newRecurring.name,
        category: newRecurring.category,
        amount: parseFloat(newRecurring.amount),
        frequency: newRecurring.frequency,
        autoAdd: newRecurring.autoAdd,
        nextDate: new Date().toISOString(),
        isActive: true,
      });

      setRecurring([...recurring, response.recurring]);
      setShowAddModal(false);
      setNewRecurring({
        name: '',
        category: 'other',
        amount: '',
        frequency: 'monthly',
        autoAdd: true,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding recurring:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المصروف المتكرر');
    }
  };

  const handleToggleActive = async (item: RecurringExpense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await recurringAPI.update(item.id, { isActive: !item.isActive });
      setRecurring(
        recurring.map((r) =>
          r.id === item.id ? { ...r, isActive: !r.isActive } : r
        )
      );
    } catch (error) {
      console.error('Error toggling recurring:', error);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    Alert.alert(
      'حذف المصروف المتكرر',
      'هل أنت متأكد من حذف هذا المصروف المتكرر؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await recurringAPI.delete(id);
              setRecurring(recurring.filter((r) => r.id !== id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting recurring:', error);
            }
          },
        },
      ]
    );
  };

  const totalMonthly = recurring
    .filter((r) => r.isActive)
    .reduce((sum, r) => {
      switch (r.frequency) {
        case 'daily':
          return sum + r.amount * 30;
        case 'weekly':
          return sum + r.amount * 4;
        case 'monthly':
          return sum + r.amount;
        case 'yearly':
          return sum + r.amount / 12;
        default:
          return sum;
      }
    }, 0);

  const upcomingCount = recurring.filter(
    (r) => r.isActive && getDaysUntilNext(r.nextDate) <= 7
  ).length;

  const renderRecurringItem = ({ item }: { item: RecurringExpense }) => {
    const category = getCategory(item.category);
    const daysUntil = getDaysUntilNext(item.nextDate);
    const isUpcoming = daysUntil <= 3;

    return (
      <TouchableOpacity
        style={[styles.recurringItem, !item.isActive && styles.recurringItemInactive]}
        onLongPress={() => handleDeleteRecurring(item.id)}
      >
        <View style={styles.recurringHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
            <Text style={styles.categoryIconText}>{category.icon}</Text>
          </View>
          <View style={styles.recurringInfo}>
            <Text style={[styles.recurringName, !item.isActive && styles.textInactive]}>
              {item.name}
            </Text>
            <View style={styles.recurringMeta}>
              <Text style={styles.frequencyText}>{getFrequencyLabel(item.frequency)}</Text>
              {item.autoAdd && (
                <View style={styles.autoBadge}>
                  <Ionicons name="sync" size={10} color="#059669" />
                  <Text style={styles.autoText}>تلقائي</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.recurringAmount}>
            <Text style={[styles.amountText, !item.isActive && styles.textInactive]}>
              {formatCurrency(item.amount)}
            </Text>
            <Text style={styles.currencyText}>ر.س</Text>
          </View>
        </View>

        {/* Next Date */}
        <View style={styles.nextDateContainer}>
          <View style={styles.nextDateInfo}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={isUpcoming ? '#EF4444' : '#6B7280'}
            />
            <Text style={[styles.nextDateText, isUpcoming && styles.nextDateUrgent]}>
              {daysUntil === 0
                ? 'اليوم'
                : daysUntil === 1
                ? 'غداً'
                : daysUntil < 0
                ? 'متأخر'
                : `بعد ${daysUntil} يوم`}
            </Text>
            <Text style={styles.nextDateFull}>{formatDate(item.nextDate)}</Text>
          </View>
          <Switch
            value={item.isActive}
            onValueChange={() => handleToggleActive(item)}
            trackColor={{ false: '#D1D5DB', true: '#D1FAE5' }}
            thumbColor={item.isActive ? '#10B981' : '#9CA3AF'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المصاريف المتكررة</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="repeat" size={24} color="#6366F1" />
            <Text style={styles.summaryLabel}>المجموع الشهري</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalMonthly)} ر.س</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="notifications" size={24} color="#F59E0B" />
            <Text style={styles.summaryLabel}>قادمة هذا الأسبوع</Text>
            <Text style={styles.summaryCount}>{upcomingCount}</Text>
          </View>
        </View>
      </View>

      {/* Recurring List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : recurring.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="repeat-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>لا توجد مصاريف متكررة</Text>
          <Text style={styles.emptySubtitle}>
            أضف فواتيرك واشتراكاتك الشهرية لتتبعها
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyButtonText}>إضافة مصروف متكرر</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recurring}
          renderItem={renderRecurringItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#059669"
            />
          }
        />
      )}

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة مصروف متكرر</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الاسم</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثال: فاتورة الكهرباء"
                placeholderTextColor="#9CA3AF"
                value={newRecurring.name}
                onChangeText={(text) => setNewRecurring({ ...newRecurring, name: text })}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الفئة</Text>
              <View style={styles.categoryGrid}>
                {RECURRING_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      newRecurring.category === category.id && styles.categoryOptionActive,
                      newRecurring.category === category.id && { borderColor: category.color },
                    ]}
                    onPress={() => setNewRecurring({ ...newRecurring, category: category.id })}
                  >
                    <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryOptionLabel,
                        newRecurring.category === category.id && { color: category.color },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>المبلغ</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newRecurring.amount}
                  onChangeText={(text) => setNewRecurring({ ...newRecurring, amount: text })}
                />
                <Text style={styles.amountCurrency}>ر.س</Text>
              </View>
            </View>

            {/* Frequency */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>التكرار</Text>
              <View style={styles.frequencyOptions}>
                {FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq.id}
                    style={[
                      styles.frequencyOption,
                      newRecurring.frequency === freq.id && styles.frequencyOptionActive,
                    ]}
                    onPress={() => setNewRecurring({ ...newRecurring, frequency: freq.id as any })}
                  >
                    <Text
                      style={[
                        styles.frequencyOptionText,
                        newRecurring.frequency === freq.id && styles.frequencyOptionTextActive,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Auto Add Toggle */}
            <View style={styles.autoAddToggle}>
              <View style={styles.autoAddInfo}>
                <Ionicons name="sync" size={20} color="#6366F1" />
                <View>
                  <Text style={styles.autoAddTitle}>إضافة تلقائية</Text>
                  <Text style={styles.autoAddDesc}>
                    إضافة المصروف تلقائياً في موعده
                  </Text>
                </View>
              </View>
              <Switch
                value={newRecurring.autoAdd}
                onValueChange={(value) => setNewRecurring({ ...newRecurring, autoAdd: value })}
                trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
                thumbColor={newRecurring.autoAdd ? '#6366F1' : '#9CA3AF'}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!newRecurring.name || !newRecurring.amount) && styles.submitButtonDisabled,
              ]}
              onPress={handleAddRecurring}
              disabled={!newRecurring.name || !newRecurring.amount}
            >
              <Text style={styles.submitButtonText}>إضافة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  recurringItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recurringItemInactive: {
    opacity: 0.6,
  },
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 22,
  },
  recurringInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  recurringName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  textInactive: {
    color: '#9CA3AF',
  },
  recurringMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  frequencyText: {
    fontSize: 12,
    color: '#6B7280',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  autoText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '500',
  },
  recurringAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  currencyText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  nextDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  nextDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextDateText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  nextDateUrgent: {
    color: '#EF4444',
  },
  nextDateFull: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  categoryOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryOptionIcon: {
    fontSize: 16,
  },
  categoryOptionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    paddingVertical: 14,
  },
  amountCurrency: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  frequencyOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  frequencyOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  frequencyOptionTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  autoAddToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  autoAddInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoAddTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  autoAddDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
