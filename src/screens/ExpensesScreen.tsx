import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useExpensesStore } from '../services/store';
import { expensesAPI } from '../services/api';

const { width } = Dimensions.get('window');

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
  'تعليم': '📚',
  'اتصالات': '📱',
  'زكاة وصدقات': '🤲',
  'عمرة وحج': '🕋',
  'رمضان': '🌙',
  'عيد': '🎉',
};

// فلاتر الفترة الزمنية
const TIME_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'هذا الأسبوع' },
  { id: 'month', label: 'هذا الشهر' },
];

interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export default function ExpensesScreen() {
  const router = useRouter();
  const { expenses, setExpenses, totalExpenses, loading, setLoading } = useExpensesStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getAll({ limit: 100 });
      setExpenses(response.expenses || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-SA', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const filterExpenses = useCallback(() => {
    let filtered = [...expenses];

    // فلتر البحث
    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.category.includes(searchQuery) ||
          e.description?.includes(searchQuery)
      );
    }

    // فلتر الفئة
    if (selectedCategory) {
      filtered = filtered.filter((e) => e.category === selectedCategory);
    }

    // فلتر الفترة الزمنية
    const now = new Date();
    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(
          (e) => new Date(e.date).toDateString() === now.toDateString()
        );
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((e) => new Date(e.date) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(
          (e) =>
            new Date(e.date).getMonth() === now.getMonth() &&
            new Date(e.date).getFullYear() === now.getFullYear()
        );
        break;
    }

    return filtered;
  }, [expenses, searchQuery, selectedFilter, selectedCategory]);

  const filteredExpenses = filterExpenses();

  const groupExpensesByDate = () => {
    const groups: { [key: string]: Expense[] } = {};
    filteredExpenses.forEach((expense) => {
      const dateKey = formatDate(expense.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(expense);
    });
    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  };

  const groupedExpenses = groupExpensesByDate();

  const handleDeleteExpense = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await expensesAPI.delete(id);
      setExpenses(expenses.filter((e) => e.id !== id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error deleting expense:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onPress={() => router.push(`/expense/${item.id}` as any)}
      onLongPress={() => handleDeleteExpense(item.id)}
    >
      <View style={styles.expenseIcon}>
        <Text style={styles.expenseIconText}>
          {CATEGORY_ICONS[item.category] || '📌'}
        </Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expenseDescription} numberOfLines={1}>
          {item.description || item.category}
        </Text>
      </View>
      <View style={styles.expenseAmountContainer}>
        <Text style={styles.expenseAmount}>-{formatCurrency(item.amount)}</Text>
        <Text style={styles.expenseCurrency}>ر.س</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDateGroup = ({ item }: { item: { date: string; items: Expense[] } }) => (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.dateTotalText}>
          {formatCurrency(item.items.reduce((sum, e) => sum + e.amount, 0))} ر.س
        </Text>
      </View>
      {item.items.map((expense) => (
        <View key={expense.id}>{renderExpenseItem({ item: expense })}</View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المصاريف</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/quick-add' as any);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>إجمالي المصاريف</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalExpenses)} ر.س</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>عدد المعاملات</Text>
          <Text style={styles.summaryCount}>{filteredExpenses.length}</Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن مصروف..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Time Filters */}
      <View style={styles.timeFilters}>
        {TIME_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.timeFilterButton,
              selectedFilter === filter.id && styles.timeFilterButtonActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedFilter(filter.id);
            }}
          >
            <Text
              style={[
                styles.timeFilterText,
                selectedFilter === filter.id && styles.timeFilterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Expenses List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : filteredExpenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>لا توجد مصاريف</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'جرب البحث بكلمات أخرى' : 'ابدأ بإضافة أول مصروف'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/quick-add' as any)}
            >
              <Text style={styles.emptyButtonText}>إضافة مصروف</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={groupedExpenses}
          renderItem={renderDateGroup}
          keyExtractor={(item) => item.date}
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تصفية حسب الفئة</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.categoryOption,
                !selectedCategory && styles.categoryOptionActive,
              ]}
              onPress={() => {
                setSelectedCategory(null);
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.categoryOptionText}>جميع الفئات</Text>
            </TouchableOpacity>
            {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selectedCategory === category && styles.categoryOptionActive,
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.categoryIcon}>{icon}</Text>
                <Text style={styles.categoryOptionText}>{category}</Text>
              </TouchableOpacity>
            ))}
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
    flexDirection: 'row',
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
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  timeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeFilterButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  timeFilterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dateTotalText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseIconText: {
    fontSize: 24,
  },
  expenseDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  expenseCurrency: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryOptionActive: {
    backgroundColor: '#D1FAE5',
  },
  categoryIcon: {
    fontSize: 20,
    marginLeft: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
  },
});
