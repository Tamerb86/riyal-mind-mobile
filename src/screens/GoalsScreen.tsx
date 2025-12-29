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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { goalsAPI } from '../services/api';

// أنواع الأهداف
const GOAL_TYPES = [
  { id: 'car', label: 'سيارة', icon: '🚗', color: '#3B82F6' },
  { id: 'home', label: 'منزل', icon: '🏠', color: '#10B981' },
  { id: 'travel', label: 'سفر', icon: '✈️', color: '#F59E0B' },
  { id: 'wedding', label: 'زواج', icon: '💍', color: '#EC4899' },
  { id: 'education', label: 'تعليم', icon: '🎓', color: '#8B5CF6' },
  { id: 'emergency', label: 'طوارئ', icon: '🏥', color: '#EF4444' },
  { id: 'gadget', label: 'أجهزة', icon: '📱', color: '#6366F1' },
  { id: 'other', label: 'أخرى', icon: '🎯', color: '#6B7280' },
];

interface Goal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  imageUrl?: string;
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'other',
    targetAmount: '',
    deadline: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getAll();
      setGoals(response.goals || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGoalType = (typeId: string) => {
    return GOAL_TYPES.find((t) => t.id === typeId) || GOAL_TYPES[GOAL_TYPES.length - 1];
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم الهدف والمبلغ المستهدف');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await goalsAPI.create({
        name: newGoal.name,
        type: newGoal.type,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        deadline: newGoal.deadline || undefined,
      });

      setGoals([...goals, response.goal]);
      setShowAddModal(false);
      setNewGoal({ name: '', type: 'other', targetAmount: '', deadline: '' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الهدف');
    }
  };

  const handleContribute = async () => {
    if (!selectedGoal || !contributeAmount) return;

    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const newAmount = selectedGoal.currentAmount + amount;
      await goalsAPI.update(selectedGoal.id, { currentAmount: newAmount });

      setGoals(
        goals.map((g) =>
          g.id === selectedGoal.id ? { ...g, currentAmount: newAmount } : g
        )
      );

      setShowContributeModal(false);
      setContributeAmount('');
      setSelectedGoal(null);

      if (newAmount >= selectedGoal.targetAmount) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🎉 مبروك!', 'لقد حققت هدفك!');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error contributing to goal:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المبلغ');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    Alert.alert(
      'حذف الهدف',
      'هل أنت متأكد من حذف هذا الهدف؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalsAPI.delete(id);
              setGoals(goals.filter((g) => g.id !== id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting goal:', error);
            }
          },
        },
      ]
    );
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const renderGoalItem = ({ item }: { item: Goal }) => {
    const goalType = getGoalType(item.type);
    const percentage = getProgressPercentage(item.currentAmount, item.targetAmount);
    const remaining = item.targetAmount - item.currentAmount;
    const daysRemaining = getDaysRemaining(item.deadline);
    const isCompleted = percentage >= 100;

    return (
      <TouchableOpacity
        style={[styles.goalItem, isCompleted && styles.goalItemCompleted]}
        onPress={() => {
          if (!isCompleted) {
            setSelectedGoal(item);
            setShowContributeModal(true);
          }
        }}
        onLongPress={() => handleDeleteGoal(item.id)}
      >
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.completedText}>تم تحقيقه!</Text>
          </View>
        )}

        <View style={styles.goalHeader}>
          <View style={[styles.goalIcon, { backgroundColor: goalType.color + '20' }]}>
            <Text style={styles.goalIconText}>{goalType.icon}</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.goalType}>{goalType.label}</Text>
          </View>
          {daysRemaining !== null && !isCompleted && (
            <View
              style={[
                styles.deadlineBadge,
                daysRemaining < 30 && styles.deadlineBadgeUrgent,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={daysRemaining < 30 ? '#EF4444' : '#6B7280'}
              />
              <Text
                style={[
                  styles.deadlineText,
                  daysRemaining < 30 && styles.deadlineTextUrgent,
                ]}
              >
                {daysRemaining > 0 ? `${daysRemaining} يوم` : 'انتهى الموعد'}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.currentAmount}>{formatCurrency(item.currentAmount)} ر.س</Text>
            <Text style={styles.targetAmount}>من {formatCurrency(item.targetAmount)} ر.س</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%`, backgroundColor: goalType.color },
              ]}
            />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
            {!isCompleted && (
              <Text style={styles.remainingText}>
                متبقي {formatCurrency(remaining)} ر.س
              </Text>
            )}
          </View>
        </View>

        {/* Action Button */}
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.contributeButton, { backgroundColor: goalType.color }]}
            onPress={() => {
              setSelectedGoal(item);
              setShowContributeModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.contributeButtonText}>أضف مبلغ</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الأهداف</Text>
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
          <Text style={styles.summaryIconText}>🎯</Text>
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>إجمالي المدخرات</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalSaved)} ر.س</Text>
          <Text style={styles.summarySubtext}>
            من أصل {formatCurrency(totalTarget)} ر.س
          </Text>
        </View>
        <View style={styles.summaryProgress}>
          <Text style={styles.summaryPercentage}>
            {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
          </Text>
        </View>
      </View>

      {/* Goals List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>لا توجد أهداف</Text>
          <Text style={styles.emptySubtitle}>
            أنشئ هدفاً ادخارياً وابدأ رحلتك نحو تحقيق أحلامك
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyButtonText}>إنشاء هدف جديد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
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

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>هدف جديد</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Goal Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>اسم الهدف</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثال: سيارة جديدة"
                placeholderTextColor="#9CA3AF"
                value={newGoal.name}
                onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
              />
            </View>

            {/* Goal Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نوع الهدف</Text>
              <View style={styles.typeGrid}>
                {GOAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeOption,
                      newGoal.type === type.id && styles.typeOptionActive,
                      newGoal.type === type.id && { borderColor: type.color },
                    ]}
                    onPress={() => setNewGoal({ ...newGoal, type: type.id })}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        newGoal.type === type.id && { color: type.color },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>المبلغ المستهدف</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newGoal.targetAmount}
                  onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
                />
                <Text style={styles.amountCurrency}>ر.س</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!newGoal.name || !newGoal.targetAmount) && styles.submitButtonDisabled,
              ]}
              onPress={handleAddGoal}
              disabled={!newGoal.name || !newGoal.targetAmount}
            >
              <Text style={styles.submitButtonText}>إنشاء الهدف</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        visible={showContributeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContributeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة مبلغ</Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <>
                <View style={styles.contributeGoalInfo}>
                  <Text style={styles.contributeGoalIcon}>
                    {getGoalType(selectedGoal.type).icon}
                  </Text>
                  <Text style={styles.contributeGoalName}>{selectedGoal.name}</Text>
                  <Text style={styles.contributeGoalProgress}>
                    {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)} ر.س
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>المبلغ</Text>
                  <View style={styles.amountInputContainer}>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={contributeAmount}
                      onChangeText={setContributeAmount}
                      autoFocus
                    />
                    <Text style={styles.amountCurrency}>ر.س</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !contributeAmount && styles.submitButtonDisabled,
                  ]}
                  onPress={handleContribute}
                  disabled={!contributeAmount}
                >
                  <Text style={styles.submitButtonText}>إضافة المبلغ</Text>
                </TouchableOpacity>
              </>
            )}
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
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
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
  summaryIconText: {
    fontSize: 28,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6D28D9',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B21B6',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
  },
  summaryProgress: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  goalItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalItemCompleted: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIconText: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  goalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  goalType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  deadlineBadgeUrgent: {
    backgroundColor: '#FEE2E2',
  },
  deadlineText: {
    fontSize: 12,
    color: '#6B7280',
  },
  deadlineTextUrgent: {
    color: '#EF4444',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  targetAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  remainingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  contributeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: '#8B5CF6',
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
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
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
  typeOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  typeIcon: {
    fontSize: 18,
  },
  typeLabel: {
    fontSize: 14,
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
    fontSize: 28,
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
  submitButton: {
    backgroundColor: '#8B5CF6',
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
  contributeGoalInfo: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  contributeGoalIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  contributeGoalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  contributeGoalProgress: {
    fontSize: 14,
    color: '#6B7280',
  },
});
