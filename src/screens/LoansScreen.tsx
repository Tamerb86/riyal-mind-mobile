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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { loansAPI } from '../services/api';

// أنواع القروض
const LOAN_TYPES = [
  { id: 'personal', label: 'قرض شخصي', icon: '💳', color: '#3B82F6' },
  { id: 'car', label: 'قرض سيارة', icon: '🚗', color: '#10B981' },
  { id: 'home', label: 'قرض عقاري', icon: '🏠', color: '#F59E0B' },
  { id: 'education', label: 'قرض تعليمي', icon: '🎓', color: '#8B5CF6' },
  { id: 'business', label: 'قرض تجاري', icon: '💼', color: '#EC4899' },
  { id: 'family', label: 'دين عائلي', icon: '👨‍👩‍👧‍👦', color: '#6366F1' },
  { id: 'friend', label: 'دين صديق', icon: '🤝', color: '#14B8A6' },
  { id: 'other', label: 'أخرى', icon: '📋', color: '#6B7280' },
];

interface Loan {
  id: string;
  name: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  monthlyPayment: number;
  interestRate?: number;
  startDate: string;
  endDate?: string;
  lender?: string;
  notes?: string;
}

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [newLoan, setNewLoan] = useState({
    name: '',
    type: 'personal',
    totalAmount: '',
    monthlyPayment: '',
    interestRate: '',
    lender: '',
  });

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const response = await loansAPI.getAll();
      setLoans(response.loans || []);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLoans();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLoanType = (typeId: string) => {
    return LOAN_TYPES.find((t) => t.id === typeId) || LOAN_TYPES[LOAN_TYPES.length - 1];
  };

  const getProgressPercentage = (paid: number, total: number) => {
    return Math.min((paid / total) * 100, 100);
  };

  const getRemainingMonths = (remaining: number, monthly: number) => {
    if (monthly <= 0) return 0;
    return Math.ceil(remaining / monthly);
  };

  const handleAddLoan = async () => {
    if (!newLoan.name || !newLoan.totalAmount || !newLoan.monthlyPayment) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع البيانات المطلوبة');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await loansAPI.create({
        name: newLoan.name,
        type: newLoan.type,
        totalAmount: parseFloat(newLoan.totalAmount),
        paidAmount: 0,
        monthlyPayment: parseFloat(newLoan.monthlyPayment),
        interestRate: newLoan.interestRate ? parseFloat(newLoan.interestRate) : undefined,
        lender: newLoan.lender || undefined,
        startDate: new Date().toISOString(),
      });

      setLoans([...loans, response.loan]);
      setShowAddModal(false);
      setNewLoan({
        name: '',
        type: 'personal',
        totalAmount: '',
        monthlyPayment: '',
        interestRate: '',
        lender: '',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding loan:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة القرض');
    }
  };

  const handlePayment = async () => {
    if (!selectedLoan || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const newPaidAmount = selectedLoan.paidAmount + amount;
      await loansAPI.pay(selectedLoan.id, amount);

      setLoans(
        loans.map((l) =>
          l.id === selectedLoan.id ? { ...l, paidAmount: newPaidAmount } : l
        )
      );

      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedLoan(null);

      if (newPaidAmount >= selectedLoan.totalAmount) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🎉 مبروك!', 'لقد سددت القرض بالكامل!');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error making payment:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  const handleDeleteLoan = async (id: string) => {
    Alert.alert(
      'حذف القرض',
      'هل أنت متأكد من حذف هذا القرض؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await loansAPI.delete(id);
              setLoans(loans.filter((l) => l.id !== id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting loan:', error);
            }
          },
        },
      ]
    );
  };

  const totalDebt = loans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
  const totalMonthlyPayments = loans.reduce((sum, l) => {
    const remaining = l.totalAmount - l.paidAmount;
    return remaining > 0 ? sum + l.monthlyPayment : sum;
  }, 0);

  const renderLoanItem = ({ item }: { item: Loan }) => {
    const loanType = getLoanType(item.type);
    const remaining = item.totalAmount - item.paidAmount;
    const percentage = getProgressPercentage(item.paidAmount, item.totalAmount);
    const remainingMonths = getRemainingMonths(remaining, item.monthlyPayment);
    const isPaidOff = remaining <= 0;

    return (
      <TouchableOpacity
        style={[styles.loanItem, isPaidOff && styles.loanItemPaidOff]}
        onPress={() => {
          if (!isPaidOff) {
            setSelectedLoan(item);
            setShowPaymentModal(true);
          }
        }}
        onLongPress={() => handleDeleteLoan(item.id)}
      >
        {isPaidOff && (
          <View style={styles.paidOffBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.paidOffText}>تم السداد</Text>
          </View>
        )}

        <View style={styles.loanHeader}>
          <View style={[styles.loanIcon, { backgroundColor: loanType.color + '20' }]}>
            <Text style={styles.loanIconText}>{loanType.icon}</Text>
          </View>
          <View style={styles.loanInfo}>
            <Text style={styles.loanName}>{item.name}</Text>
            <Text style={styles.loanType}>{loanType.label}</Text>
            {item.lender && (
              <Text style={styles.loanLender}>من: {item.lender}</Text>
            )}
          </View>
          {item.interestRate && (
            <View style={styles.interestBadge}>
              <Text style={styles.interestText}>{item.interestRate}%</Text>
              <Text style={styles.interestLabel}>فائدة</Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.paidLabel}>المسدد</Text>
            <Text style={styles.paidAmount}>
              {formatCurrency(item.paidAmount)} / {formatCurrency(item.totalAmount)} ر.س
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%`, backgroundColor: loanType.color },
              ]}
            />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
            {!isPaidOff && (
              <Text style={styles.remainingText}>
                متبقي {formatCurrency(remaining)} ر.س
              </Text>
            )}
          </View>
        </View>

        {/* Monthly Payment Info */}
        {!isPaidOff && (
          <View style={styles.paymentInfo}>
            <View style={styles.paymentItem}>
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text style={styles.paymentLabel}>القسط الشهري</Text>
              <Text style={styles.paymentValue}>{formatCurrency(item.monthlyPayment)} ر.س</Text>
            </View>
            <View style={styles.paymentDivider} />
            <View style={styles.paymentItem}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.paymentLabel}>الأشهر المتبقية</Text>
              <Text style={styles.paymentValue}>{remainingMonths} شهر</Text>
            </View>
          </View>
        )}

        {/* Pay Button */}
        {!isPaidOff && (
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: loanType.color }]}
            onPress={() => {
              setSelectedLoan(item);
              setPaymentAmount(item.monthlyPayment.toString());
              setShowPaymentModal(true);
            }}
          >
            <Ionicons name="card-outline" size={20} color="#FFFFFF" />
            <Text style={styles.payButtonText}>سدد دفعة</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>القروض والديون</Text>
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
            <Ionicons name="trending-down" size={24} color="#EF4444" />
            <Text style={styles.summaryLabel}>إجمالي الديون</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalDebt)} ر.س</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="calendar" size={24} color="#F59E0B" />
            <Text style={styles.summaryLabel}>الأقساط الشهرية</Text>
            <Text style={styles.summaryAmountOrange}>{formatCurrency(totalMonthlyPayments)} ر.س</Text>
          </View>
        </View>
      </View>

      {/* Loans List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : loans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>لا توجد قروض</Text>
          <Text style={styles.emptySubtitle}>
            سجل قروضك وديونك لتتبع سدادها بسهولة
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyButtonText}>إضافة قرض</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={loans}
          renderItem={renderLoanItem}
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

      {/* Add Loan Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة قرض جديد</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Loan Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>اسم القرض</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="مثال: قرض السيارة"
                  placeholderTextColor="#9CA3AF"
                  value={newLoan.name}
                  onChangeText={(text) => setNewLoan({ ...newLoan, name: text })}
                />
              </View>

              {/* Loan Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نوع القرض</Text>
                <View style={styles.typeGrid}>
                  {LOAN_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeOption,
                        newLoan.type === type.id && styles.typeOptionActive,
                        newLoan.type === type.id && { borderColor: type.color },
                      ]}
                      onPress={() => setNewLoan({ ...newLoan, type: type.id })}
                    >
                      <Text style={styles.typeIcon}>{type.icon}</Text>
                      <Text
                        style={[
                          styles.typeLabel,
                          newLoan.type === type.id && { color: type.color },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Total Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>المبلغ الإجمالي</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={newLoan.totalAmount}
                    onChangeText={(text) => setNewLoan({ ...newLoan, totalAmount: text })}
                  />
                  <Text style={styles.amountCurrency}>ر.س</Text>
                </View>
              </View>

              {/* Monthly Payment */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>القسط الشهري</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={newLoan.monthlyPayment}
                    onChangeText={(text) => setNewLoan({ ...newLoan, monthlyPayment: text })}
                  />
                  <Text style={styles.amountCurrency}>ر.س</Text>
                </View>
              </View>

              {/* Interest Rate (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نسبة الفائدة (اختياري)</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={newLoan.interestRate}
                    onChangeText={(text) => setNewLoan({ ...newLoan, interestRate: text })}
                  />
                  <Text style={styles.amountCurrency}>%</Text>
                </View>
              </View>

              {/* Lender (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الجهة المقرضة (اختياري)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="مثال: بنك الراجحي"
                  placeholderTextColor="#9CA3AF"
                  value={newLoan.lender}
                  onChangeText={(text) => setNewLoan({ ...newLoan, lender: text })}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!newLoan.name || !newLoan.totalAmount || !newLoan.monthlyPayment) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleAddLoan}
                disabled={!newLoan.name || !newLoan.totalAmount || !newLoan.monthlyPayment}
              >
                <Text style={styles.submitButtonText}>إضافة القرض</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسديد دفعة</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedLoan && (
              <>
                <View style={styles.paymentLoanInfo}>
                  <Text style={styles.paymentLoanIcon}>
                    {getLoanType(selectedLoan.type).icon}
                  </Text>
                  <Text style={styles.paymentLoanName}>{selectedLoan.name}</Text>
                  <Text style={styles.paymentLoanRemaining}>
                    المتبقي: {formatCurrency(selectedLoan.totalAmount - selectedLoan.paidAmount)} ر.س
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>مبلغ الدفعة</Text>
                  <View style={styles.amountInputContainer}>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      autoFocus
                    />
                    <Text style={styles.amountCurrency}>ر.س</Text>
                  </View>
                </View>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmounts}>
                  <TouchableOpacity
                    style={styles.quickAmountButton}
                    onPress={() => setPaymentAmount(selectedLoan.monthlyPayment.toString())}
                  >
                    <Text style={styles.quickAmountText}>القسط الشهري</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickAmountButton}
                    onPress={() =>
                      setPaymentAmount(
                        (selectedLoan.totalAmount - selectedLoan.paidAmount).toString()
                      )
                    }
                  >
                    <Text style={styles.quickAmountText}>المبلغ المتبقي</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !paymentAmount && styles.submitButtonDisabled,
                  ]}
                  onPress={handlePayment}
                  disabled={!paymentAmount}
                >
                  <Text style={styles.submitButtonText}>تأكيد الدفع</Text>
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
    backgroundColor: '#F59E0B',
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
    color: '#EF4444',
  },
  summaryAmountOrange: {
    fontSize: 20,
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
  loanItem: {
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
  loanItemPaidOff: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  paidOffBadge: {
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
  paidOffText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loanIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanIconText: {
    fontSize: 24,
  },
  loanInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  loanName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loanType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  loanLender: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  interestBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  interestText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D97706',
  },
  interestLabel: {
    fontSize: 10,
    color: '#92400E',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paidLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paidAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
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
    color: '#EF4444',
  },
  paymentInfo: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  paymentItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  payButtonText: {
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
    backgroundColor: '#F59E0B',
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
  submitButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  paymentLoanInfo: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  paymentLoanIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  paymentLoanName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  paymentLoanRemaining: {
    fontSize: 14,
    color: '#EF4444',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});
