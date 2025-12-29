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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useIncomeStore } from '../services/store';
import { incomeAPI } from '../services/api';

// أنواع الدخل
const INCOME_TYPES = [
  { id: 'salary', label: 'راتب', icon: '💼', color: '#10B981' },
  { id: 'bonus', label: 'مكافأة', icon: '🎁', color: '#F59E0B' },
  { id: 'freelance', label: 'عمل حر', icon: '💻', color: '#3B82F6' },
  { id: 'investment', label: 'استثمار', icon: '📈', color: '#8B5CF6' },
  { id: 'rental', label: 'إيجار', icon: '🏠', color: '#EC4899' },
  { id: 'gift', label: 'هدية', icon: '🎀', color: '#EF4444' },
  { id: 'other', label: 'أخرى', icon: '💰', color: '#6B7280' },
];

interface Income {
  id: string;
  amount: number;
  source: string;
  description?: string;
  date: string;
  isRecurring?: boolean;
}

export default function IncomeScreen() {
  const { incomes, setIncomes, totalIncome, loading, setLoading } = useIncomeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIncome, setNewIncome] = useState({
    amount: '',
    source: 'salary',
    description: '',
    isRecurring: false,
  });

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = async () => {
    try {
      setLoading(true);
      const response = await incomeAPI.getAll();
      setIncomes(response.incomes || []);
    } catch (error) {
      console.error('Error loading incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncomes();
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
      year: 'numeric',
    });
  };

  const getIncomeType = (source: string) => {
    return INCOME_TYPES.find((t) => t.id === source) || INCOME_TYPES[INCOME_TYPES.length - 1];
  };

  const handleAddIncome = async () => {
    if (!newIncome.amount || parseFloat(newIncome.amount) <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await incomeAPI.create({
        amount: parseFloat(newIncome.amount),
        source: newIncome.source,
        description: newIncome.description,
        isRecurring: newIncome.isRecurring,
        date: new Date().toISOString(),
      });

      setIncomes([response.income, ...incomes]);
      setShowAddModal(false);
      setNewIncome({ amount: '', source: 'salary', description: '', isRecurring: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding income:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الدخل');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    Alert.alert(
      'حذف الدخل',
      'هل أنت متأكد من حذف هذا الدخل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await incomeAPI.delete(id);
              setIncomes(incomes.filter((i) => i.id !== id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting income:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  };

  const renderIncomeItem = ({ item }: { item: Income }) => {
    const incomeType = getIncomeType(item.source);
    
    return (
      <TouchableOpacity
        style={styles.incomeItem}
        onLongPress={() => handleDeleteIncome(item.id)}
      >
        <View style={[styles.incomeIcon, { backgroundColor: incomeType.color + '20' }]}>
          <Text style={styles.incomeIconText}>{incomeType.icon}</Text>
        </View>
        <View style={styles.incomeDetails}>
          <View style={styles.incomeHeader}>
            <Text style={styles.incomeSource}>{incomeType.label}</Text>
            {item.isRecurring && (
              <View style={styles.recurringBadge}>
                <Ionicons name="repeat" size={12} color="#059669" />
                <Text style={styles.recurringText}>متكرر</Text>
              </View>
            )}
          </View>
          <Text style={styles.incomeDescription} numberOfLines={1}>
            {item.description || incomeType.label}
          </Text>
          <Text style={styles.incomeDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.incomeAmountContainer}>
          <Text style={styles.incomeAmount}>+{formatCurrency(item.amount)}</Text>
          <Text style={styles.incomeCurrency}>ر.س</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الدخل</Text>
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
        <View style={styles.summaryIcon}>
          <Ionicons name="trending-up" size={32} color="#10B981" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>إجمالي الدخل هذا الشهر</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalIncome)} ر.س</Text>
        </View>
      </View>

      {/* Income Types Quick Stats */}
      <View style={styles.quickStats}>
        {INCOME_TYPES.slice(0, 4).map((type) => {
          const typeTotal = incomes
            .filter((i) => i.source === type.id)
            .reduce((sum, i) => sum + i.amount, 0);
          
          return (
            <View key={type.id} style={styles.quickStatItem}>
              <View style={[styles.quickStatIcon, { backgroundColor: type.color + '20' }]}>
                <Text style={styles.quickStatIconText}>{type.icon}</Text>
              </View>
              <Text style={styles.quickStatLabel}>{type.label}</Text>
              <Text style={styles.quickStatAmount}>{formatCurrency(typeTotal)}</Text>
            </View>
          );
        })}
      </View>

      {/* Income List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : incomes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>لا يوجد دخل مسجل</Text>
          <Text style={styles.emptySubtitle}>أضف مصادر دخلك لتتبع أموالك</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyButtonText}>إضافة دخل</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={incomes}
          renderItem={renderIncomeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10B981"
            />
          }
        />
      )}

      {/* Add Income Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة دخل جديد</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>المبلغ</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newIncome.amount}
                  onChangeText={(text) => setNewIncome({ ...newIncome, amount: text })}
                />
                <Text style={styles.amountCurrency}>ر.س</Text>
              </View>
            </View>

            {/* Source Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نوع الدخل</Text>
              <View style={styles.sourceGrid}>
                {INCOME_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.sourceOption,
                      newIncome.source === type.id && styles.sourceOptionActive,
                    ]}
                    onPress={() => setNewIncome({ ...newIncome, source: type.id })}
                  >
                    <Text style={styles.sourceIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.sourceLabel,
                        newIncome.source === type.id && styles.sourceLabelActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الوصف (اختياري)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="مثال: راتب شهر ديسمبر"
                placeholderTextColor="#9CA3AF"
                value={newIncome.description}
                onChangeText={(text) => setNewIncome({ ...newIncome, description: text })}
              />
            </View>

            {/* Recurring Toggle */}
            <TouchableOpacity
              style={styles.recurringToggle}
              onPress={() => setNewIncome({ ...newIncome, isRecurring: !newIncome.isRecurring })}
            >
              <View style={styles.recurringToggleContent}>
                <Ionicons name="repeat" size={20} color="#059669" />
                <Text style={styles.recurringToggleText}>دخل متكرر شهرياً</Text>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  newIncome.isRecurring && styles.toggleSwitchActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    newIncome.isRecurring && styles.toggleKnobActive,
                  ]}
                />
              </View>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !newIncome.amount && styles.submitButtonDisabled,
              ]}
              onPress={handleAddIncome}
              disabled={!newIncome.amount}
            >
              <Text style={styles.submitButtonText}>إضافة الدخل</Text>
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
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#065F46',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#047857',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStatIconText: {
    fontSize: 20,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  quickStatAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  incomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeIconText: {
    fontSize: 24,
  },
  incomeDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  incomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  incomeSource: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  recurringText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '500',
  },
  incomeDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
  },
  incomeDate: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  incomeAmountContainer: {
    alignItems: 'flex-end',
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  incomeCurrency: {
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
    backgroundColor: '#10B981',
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
    marginBottom: 8,
    textAlign: 'right',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    paddingVertical: 16,
  },
  amountCurrency: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  sourceOptionActive: {
    backgroundColor: '#D1FAE5',
  },
  sourceIcon: {
    fontSize: 16,
  },
  sourceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  sourceLabelActive: {
    color: '#059669',
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  recurringToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recurringToggleText: {
    fontSize: 16,
    color: '#374151',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  submitButton: {
    backgroundColor: '#10B981',
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
