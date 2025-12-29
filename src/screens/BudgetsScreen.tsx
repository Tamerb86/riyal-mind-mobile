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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { budgetsAPI } from '../services/api';

const { width } = Dimensions.get('window');

// الفئات المتاحة للميزانية
const BUDGET_CATEGORIES = [
  { id: 'food', label: 'طعام ومطاعم', icon: '🍔', color: '#EF4444' },
  { id: 'transport', label: 'مواصلات', icon: '🚗', color: '#F59E0B' },
  { id: 'shopping', label: 'تسوق', icon: '🛍️', color: '#EC4899' },
  { id: 'entertainment', label: 'ترفيه', icon: '🎬', color: '#8B5CF6' },
  { id: 'bills', label: 'فواتير', icon: '📄', color: '#3B82F6' },
  { id: 'health', label: 'صحة', icon: '🏥', color: '#10B981' },
  { id: 'education', label: 'تعليم', icon: '📚', color: '#6366F1' },
  { id: 'grocery', label: 'بقالة', icon: '🛒', color: '#14B8A6' },
];

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly';
}

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: '',
    period: 'monthly' as 'monthly' | 'weekly',
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetsAPI.getAll();
      setBudgets(response.budgets || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryInfo = (categoryId: string) => {
    return BUDGET_CATEGORIES.find((c) => c.id === categoryId) || {
      id: categoryId,
      label: categoryId,
      icon: '📌',
      color: '#6B7280',
    };
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#EF4444';
    if (percentage >= 80) return '#F59E0B';
    return '#10B981';
  };

  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.limit) {
      Alert.alert('خطأ', 'الرجاء اختيار الفئة وتحديد الميزانية');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await budgetsAPI.create({
        category: newBudget.category,
        amount: parseFloat(newBudget.limit),
        period: newBudget.period,
      });

      setBudgets([...budgets, response.budget]);
      setShowAddModal(false);
      setNewBudget({ category: '', limit: '', period: 'monthly' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding budget:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الميزانية');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    Alert.alert(
      'حذف الميزانية',
      'هل أنت متأكد من حذف هذه الميزانية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetsAPI.delete(id);
              setBudgets(budgets.filter((b) => b.id !== id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting budget:', error);
            }
          },
        },
      ]
    );
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const category = getCategoryInfo(item.category);
    const percentage = getProgressPercentage(item.spent, item.limit);
    const progressColor = getProgressColor(percentage);
    const remaining = item.limit - item.spent;

    return (
      <TouchableOpacity
        style={styles.budgetItem}
        onLongPress={() => handleDeleteBudget(item.id)}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetCategory}>
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
              <Text style={styles.categoryIconText}>{category.icon}</Text>
            </View>
            <View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <Text style={styles.periodLabel}>
                {item.period === 'monthly' ? 'شهري' : 'أسبوعي'}
              </Text>
            </View>
          </View>
          <View style={styles.budgetAmounts}>
            <Text style={styles.spentAmount}>{formatCurrency(item.spent)}</Text>
            <Text style={styles.limitAmount}>/ {formatCurrency(item.limit)} ر.س</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%`, backgroundColor: progressColor },
              ]}
            />
          </View>
          <Text style={[styles.percentageText, { color: progressColor }]}>
            {Math.round(percentage)}%
          </Text>
        </View>

        {/* Remaining */}
        <View style={styles.remainingContainer}>
          <Text style={styles.remainingLabel}>المتبقي</Text>
          <Text
            style={[
              styles.remainingAmount,
              remaining < 0 && styles.overBudget,
            ]}
          >
            {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`} ر.س
          </Text>
        </View>

        {/* Warning if over 80% */}
        {percentage >= 80 && (
          <View
            style={[
              styles.warningBanner,
              percentage >= 100 && styles.dangerBanner,
            ]}
          >
            <Ionicons
              name={percentage >= 100 ? 'alert-circle' : 'warning'}
              size={16}
              color={percentage >= 100 ? '#DC2626' : '#D97706'}
            />
            <Text
              style={[
                styles.warningText,
                percentage >= 100 && styles.dangerText,
              ]}
            >
              {percentage >= 100
                ? 'تجاوزت الميزانية!'
                : 'اقتربت من حد الميزانية'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الميزانيات</Text>
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
            <Text style={styles.summaryLabel}>إجمالي الميزانية</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalBudget)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>المصروف</Text>
            <Text style={[styles.summaryAmount, styles.spentColor]}>
              {formatCurrency(totalSpent)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>المتبقي</Text>
            <Text
              style={[
                styles.summaryAmount,
                totalRemaining >= 0 ? styles.remainingColor : styles.overBudgetColor,
              ]}
            >
              {formatCurrency(Math.abs(totalRemaining))}
            </Text>
          </View>
        </View>
        <View style={styles.overallProgress}>
          <View style={styles.overallProgressBar}>
            <View
              style={[
                styles.overallProgressFill,
                {
                  width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                  backgroundColor: getProgressColor((totalSpent / totalBudget) * 100),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Budgets List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>لا توجد ميزانيات</Text>
          <Text style={styles.emptySubtitle}>
            أنشئ ميزانية لكل فئة للتحكم في مصاريفك
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyButtonText}>إنشاء ميزانية</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderBudgetItem}
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

      {/* Add Budget Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إنشاء ميزانية جديدة</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الفئة</Text>
              <View style={styles.categoryGrid}>
                {BUDGET_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      newBudget.category === category.id && styles.categoryOptionActive,
                      newBudget.category === category.id && { borderColor: category.color },
                    ]}
                    onPress={() => setNewBudget({ ...newBudget, category: category.id })}
                  >
                    <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryOptionLabel,
                        newBudget.category === category.id && { color: category.color },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Limit Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>حد الميزانية</Text>
              <View style={styles.limitInputContainer}>
                <TextInput
                  style={styles.limitInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newBudget.limit}
                  onChangeText={(text) => setNewBudget({ ...newBudget, limit: text })}
                />
                <Text style={styles.limitCurrency}>ر.س</Text>
              </View>
            </View>

            {/* Period Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الفترة</Text>
              <View style={styles.periodOptions}>
                <TouchableOpacity
                  style={[
                    styles.periodOption,
                    newBudget.period === 'monthly' && styles.periodOptionActive,
                  ]}
                  onPress={() => setNewBudget({ ...newBudget, period: 'monthly' })}
                >
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={newBudget.period === 'monthly' ? '#059669' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.periodOptionText,
                      newBudget.period === 'monthly' && styles.periodOptionTextActive,
                    ]}
                  >
                    شهري
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodOption,
                    newBudget.period === 'weekly' && styles.periodOptionActive,
                  ]}
                  onPress={() => setNewBudget({ ...newBudget, period: 'weekly' })}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={newBudget.period === 'weekly' ? '#059669' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.periodOptionText,
                      newBudget.period === 'weekly' && styles.periodOptionTextActive,
                    ]}
                  >
                    أسبوعي
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!newBudget.category || !newBudget.limit) && styles.submitButtonDisabled,
              ]}
              onPress={handleAddBudget}
              disabled={!newBudget.category || !newBudget.limit}
            >
              <Text style={styles.submitButtonText}>إنشاء الميزانية</Text>
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
    backgroundColor: '#059669',
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
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  spentColor: {
    color: '#EF4444',
  },
  remainingColor: {
    color: '#10B981',
  },
  overBudgetColor: {
    color: '#EF4444',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  overallProgress: {
    marginTop: 16,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  budgetItem: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  periodLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  budgetAmounts: {
    alignItems: 'flex-end',
  },
  spentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  limitAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  remainingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  overBudget: {
    color: '#EF4444',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  dangerBanner: {
    backgroundColor: '#FEE2E2',
  },
  warningText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  dangerText: {
    color: '#DC2626',
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
    backgroundColor: '#059669',
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
    maxHeight: '85%',
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
    marginBottom: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  categoryOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryOptionIcon: {
    fontSize: 18,
  },
  categoryOptionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  limitInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  limitInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    paddingVertical: 16,
  },
  limitCurrency: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  periodOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  periodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  periodOptionActive: {
    backgroundColor: '#D1FAE5',
  },
  periodOptionText: {
    fontSize: 16,
    color: '#6B7280',
  },
  periodOptionTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
