import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { expensesAPI } from '../services/api';
import { useExpensesStore } from '../services/store';

// الفئات السريعة
const QUICK_CATEGORIES = [
  { name: 'طعام ومطاعم', icon: '🍔', color: '#FF6B6B' },
  { name: 'بنزين', icon: '⛽', color: '#4ECDC4' },
  { name: 'بقالة وتموينات', icon: '🛒', color: '#45B7D1' },
  { name: 'قهوة', icon: '☕', color: '#96CEB4' },
  { name: 'توصيل', icon: '🛵', color: '#DDA0DD' },
  { name: 'مواصلات', icon: '🚗', color: '#F39C12' },
];

// المبالغ السريعة
const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

// جميع الفئات
const ALL_CATEGORIES = [
  { group: 'الطعام والمشروبات', icon: '🍽️', items: [
    { name: 'طعام ومطاعم', icon: '🍔' },
    { name: 'قهوة', icon: '☕' },
    { name: 'بقالة وتموينات', icon: '🛒' },
    { name: 'توصيل', icon: '🛵' },
  ]},
  { group: 'المواصلات', icon: '🚗', items: [
    { name: 'بنزين', icon: '⛽' },
    { name: 'مواصلات', icon: '🚗' },
    { name: 'أوبر/كريم', icon: '🚕' },
    { name: 'صيانة سيارة', icon: '🔧' },
  ]},
  { group: 'الفواتير', icon: '📄', items: [
    { name: 'كهرباء', icon: '💡' },
    { name: 'ماء', icon: '💧' },
    { name: 'إنترنت', icon: '📶' },
    { name: 'جوال', icon: '📱' },
  ]},
  { group: 'التسوق', icon: '🛍️', items: [
    { name: 'ملابس', icon: '👕' },
    { name: 'إلكترونيات', icon: '📱' },
    { name: 'أثاث', icon: '🛋️' },
    { name: 'هدايا', icon: '🎁' },
  ]},
  { group: 'الدينية', icon: '🕌', items: [
    { name: 'زكاة', icon: '🤲' },
    { name: 'صدقة', icon: '💝' },
    { name: 'عمرة', icon: '🕋' },
    { name: 'حج', icon: '🕌' },
  ]},
  { group: 'الترفيه', icon: '🎬', items: [
    { name: 'سينما', icon: '🎬' },
    { name: 'ألعاب', icon: '🎮' },
    { name: 'سفر', icon: '✈️' },
    { name: 'رياضة', icon: '⚽' },
  ]},
];

export default function QuickAddScreen() {
  const router = useRouter();
  const { addExpense } = useExpensesStore();
  const amountInputRef = useRef<TextInput>(null);
  const successAnimation = useRef(new Animated.Value(0)).current;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Focus on amount input
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 300);
  }, []);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!category) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await expensesAPI.create({
        amount: parseFloat(amount),
        category,
        description: description || category,
        date: new Date().toISOString(),
      });

      if (response.expense) {
        addExpense(response.expense);
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Animate success
        Animated.spring(successAnimation, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(value.toString());
  };

  const handleQuickCategory = (cat: { name: string; icon: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(cat.name);
    setShowAllCategories(false);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Animated.View
          style={[
            styles.successIcon,
            {
              transform: [
                {
                  scale: successAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </Animated.View>
        <Text style={styles.successTitle}>تم بنجاح!</Text>
        <Text style={styles.successSubtitle}>تم إضافة المصروف</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إضافة سريعة</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !amount || !category}
            style={[
              styles.submitButton,
              (!amount || !category) && styles.submitButtonDisabled,
            ]}
          >
            {loading ? (
              <Ionicons name="hourglass" size={20} color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>المبلغ</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                ref={amountInputRef}
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
                keyboardType="decimal-pad"
                textAlign="center"
              />
              <Text style={styles.currencyLabel}>ر.س</Text>
            </View>
            {amount && (
              <Text style={styles.amountFormatted}>
                {formatCurrency(amount)} ريال سعودي
              </Text>
            )}
          </View>

          {/* Quick Amounts */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>مبالغ سريعة</Text>
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleQuickAmount(value)}
                  style={[
                    styles.quickAmountButton,
                    amount === value.toString() && styles.quickAmountButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      amount === value.toString() && styles.quickAmountTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>الفئة</Text>
            <View style={styles.quickCategories}>
              {QUICK_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => handleQuickCategory(cat)}
                  style={[
                    styles.quickCategoryButton,
                    category === cat.name && styles.quickCategoryButtonActive,
                  ]}
                >
                  <Text style={styles.quickCategoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.quickCategoryText,
                      category === cat.name && styles.quickCategoryTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowAllCategories(true)}
              style={styles.moreCategoriesButton}
            >
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
              <Text style={styles.moreCategoriesText}>المزيد من الفئات</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.inputRow}>
              <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="وصف (اختياري)"
                placeholderTextColor="#9CA3AF"
                textAlign="right"
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push('/scanner' as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="camera" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.quickActionText}>مسح فاتورة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push('/add-expense' as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="create" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionText}>إضافة تفصيلية</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !amount || !category}
            style={[
              styles.submitButtonLarge,
              (!amount || !category) && styles.submitButtonLargeDisabled,
            ]}
          >
            {loading ? (
              <Ionicons name="hourglass" size={24} color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  إضافة {amount ? `${formatCurrency(amount)} ر.س` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* All Categories Modal */}
        {showAllCategories && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>جميع الفئات</Text>
                <TouchableOpacity onPress={() => setShowAllCategories(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {ALL_CATEGORIES.map((group) => (
                  <View key={group.group} style={styles.categoryGroup}>
                    <View style={styles.categoryGroupHeader}>
                      <Text style={styles.categoryGroupIcon}>{group.icon}</Text>
                      <Text style={styles.categoryGroupTitle}>{group.group}</Text>
                    </View>
                    <View style={styles.categoryGroupItems}>
                      {group.items.map((item) => (
                        <TouchableOpacity
                          key={item.name}
                          onPress={() => handleQuickCategory(item)}
                          style={[
                            styles.categoryItem,
                            category === item.name && styles.categoryItemActive,
                          ]}
                        >
                          <Text style={styles.categoryItemIcon}>{item.icon}</Text>
                          <Text style={styles.categoryItemText}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  amountContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    minWidth: 100,
  },
  currencyLabel: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  amountFormatted: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'right',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickAmountButtonActive: {
    backgroundColor: '#10B981',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quickAmountTextActive: {
    color: '#FFFFFF',
  },
  quickCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickCategoryButtonActive: {
    backgroundColor: '#10B981',
  },
  quickCategoryIcon: {
    fontSize: 18,
  },
  quickCategoryText: {
    fontSize: 12,
    color: '#374151',
  },
  quickCategoryTextActive: {
    color: '#FFFFFF',
  },
  moreCategoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  moreCategoriesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickActionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonLargeDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  categoryGroup: {
    padding: 16,
  },
  categoryGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryGroupIcon: {
    fontSize: 20,
  },
  categoryGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryGroupItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  categoryItemActive: {
    backgroundColor: '#D1FAE5',
  },
  categoryItemIcon: {
    fontSize: 16,
  },
  categoryItemText: {
    fontSize: 12,
    color: '#374151',
  },
});
