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
import * as Haptics from 'expo-haptics';
import { reportsAPI } from '../services/api';
import { PieChart, LineChart, BarChart } from '../components/charts';

const { width } = Dimensions.get('window');

// الفترات الزمنية
const TIME_PERIODS = [
  { id: 'week', label: 'أسبوع' },
  { id: 'month', label: 'شهر' },
  { id: 'quarter', label: '3 أشهر' },
  { id: 'year', label: 'سنة' },
];

// أنواع الرسوم البيانية
const CHART_TYPES = [
  { id: 'pie', label: 'دائري', icon: 'pie-chart' },
  { id: 'bar', label: 'أعمدة', icon: 'bar-chart' },
  { id: 'line', label: 'خطي', icon: 'trending-up' },
];

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

interface DailyData {
  date: string;
  amount: number;
}

interface ReportData {
  totalExpenses: number;
  totalIncome: number;
  savings: number;
  savingsRate: number;
  categoryBreakdown: CategoryData[];
  dailyExpenses: DailyData[];
  weeklyExpenses: { week: string; amount: number }[];
  dailyAverage: number;
  topCategory: string;
  comparedToLastPeriod: number;
}

const CATEGORY_COLORS: Record<string, { color: string; icon: string }> = {
  'طعام ومطاعم': { color: '#EF4444', icon: '🍔' },
  'بنزين': { color: '#F59E0B', icon: '⛽' },
  'بقالة وتموينات': { color: '#10B981', icon: '🛒' },
  'قهوة': { color: '#8B5CF6', icon: '☕' },
  'توصيل': { color: '#EC4899', icon: '🛵' },
  'مواصلات': { color: '#3B82F6', icon: '🚗' },
  'فواتير': { color: '#6366F1', icon: '📄' },
  'تسوق': { color: '#14B8A6', icon: '🛍️' },
  'ترفيه': { color: '#F97316', icon: '🎬' },
  'صحة': { color: '#06B6D4', icon: '🏥' },
};

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedChartType, setSelectedChartType] = useState('pie');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    loadReport();
  }, [selectedPeriod]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getSummary(selectedPeriod);
      setReportData(response);
    } catch (error) {
      console.error('Error loading report:', error);
      // بيانات تجريبية
      setReportData({
        totalExpenses: 4500,
        totalIncome: 12000,
        savings: 7500,
        savingsRate: 62.5,
        categoryBreakdown: [
          { category: 'طعام ومطاعم', amount: 1500, percentage: 33, color: '#EF4444', icon: '🍔' },
          { category: 'بنزين', amount: 800, percentage: 18, color: '#F59E0B', icon: '⛽' },
          { category: 'فواتير', amount: 700, percentage: 16, color: '#6366F1', icon: '📄' },
          { category: 'تسوق', amount: 600, percentage: 13, color: '#14B8A6', icon: '🛍️' },
          { category: 'ترفيه', amount: 500, percentage: 11, color: '#F97316', icon: '🎬' },
          { category: 'أخرى', amount: 400, percentage: 9, color: '#6B7280', icon: '📌' },
        ],
        dailyExpenses: [
          { date: 'السبت', amount: 120 },
          { date: 'الأحد', amount: 250 },
          { date: 'الإثنين', amount: 180 },
          { date: 'الثلاثاء', amount: 320 },
          { date: 'الأربعاء', amount: 150 },
          { date: 'الخميس', amount: 280 },
          { date: 'الجمعة', amount: 200 },
        ],
        weeklyExpenses: [
          { week: 'أسبوع 1', amount: 1100 },
          { week: 'أسبوع 2', amount: 950 },
          { week: 'أسبوع 3', amount: 1250 },
          { week: 'أسبوع 4', amount: 1200 },
        ],
        dailyAverage: 150,
        topCategory: 'طعام ومطاعم',
        comparedToLastPeriod: -12,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePeriodChange = (period: string) => {
    Haptics.selectionAsync();
    setSelectedPeriod(period);
  };

  const handleChartTypeChange = (type: string) => {
    Haptics.selectionAsync();
    setSelectedChartType(type);
  };

  // تحويل بيانات الفئات للرسم الدائري
  const getPieChartData = () => {
    if (!reportData) return [];
    return reportData.categoryBreakdown.map((cat) => ({
      name: cat.category,
      value: cat.amount,
      color: cat.color,
      icon: cat.icon,
    }));
  };

  // تحويل بيانات المصاريف اليومية للرسم الخطي
  const getLineChartData = () => {
    if (!reportData) return [];
    return reportData.dailyExpenses.map((d) => ({
      label: d.date,
      value: d.amount,
    }));
  };

  // تحويل بيانات الفئات للرسم العمودي
  const getBarChartData = () => {
    if (!reportData) return [];
    return reportData.categoryBreakdown.slice(0, 5).map((cat) => ({
      label: cat.icon,
      value: cat.amount,
      color: cat.color,
    }));
  };

  if (loading || !reportData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري تحميل التقرير...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>التقارير</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {TIME_PERIODS.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive,
              ]}
              onPress={() => handlePeriodChange(period.id)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.id && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Ionicons name="arrow-down-circle" size={28} color="#10B981" />
            <Text style={styles.summaryLabel}>الدخل</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(reportData.totalIncome)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Ionicons name="arrow-up-circle" size={28} color="#EF4444" />
            <Text style={styles.summaryLabel}>المصاريف</Text>
            <Text style={styles.summaryAmountRed}>{formatCurrency(reportData.totalExpenses)}</Text>
          </View>
        </View>

        {/* Savings Card */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <View>
              <Text style={styles.savingsLabel}>المدخرات</Text>
              <Text style={styles.savingsAmount}>{formatCurrency(reportData.savings)} ر.س</Text>
            </View>
            <View style={styles.savingsRate}>
              <Text style={styles.savingsRateValue}>{reportData.savingsRate}%</Text>
              <Text style={styles.savingsRateLabel}>نسبة الادخار</Text>
            </View>
          </View>
          <View style={styles.savingsBar}>
            <View
              style={[styles.savingsBarFill, { width: `${reportData.savingsRate}%` }]}
            />
          </View>
          <View style={styles.comparisonContainer}>
            <Ionicons
              name={reportData.comparedToLastPeriod < 0 ? 'trending-down' : 'trending-up'}
              size={18}
              color={reportData.comparedToLastPeriod < 0 ? '#10B981' : '#EF4444'}
            />
            <Text
              style={[
                styles.comparisonText,
                { color: reportData.comparedToLastPeriod < 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {Math.abs(reportData.comparedToLastPeriod)}% مقارنة بالفترة السابقة
            </Text>
          </View>
        </View>

        {/* Chart Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>توزيع المصاريف</Text>
          <View style={styles.chartTypeSelector}>
            {CHART_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.chartTypeButton,
                  selectedChartType === type.id && styles.chartTypeButtonActive,
                ]}
                onPress={() => handleChartTypeChange(type.id)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={selectedChartType === type.id ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.chartTypeText,
                    selectedChartType === type.id && styles.chartTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Charts */}
        <View style={styles.chartContainer}>
          {selectedChartType === 'pie' && (
            <PieChart
              data={getPieChartData()}
              size={width - 80}
              innerRadius={70}
              showLabels={true}
              showLegend={true}
              centerLabel="المجموع"
              centerValue={formatCurrency(reportData.totalExpenses)}
            />
          )}

          {selectedChartType === 'bar' && (
            <BarChart
              data={getBarChartData()}
              width={width - 40}
              height={250}
              showValues={true}
              showGrid={true}
              title="أعلى 5 فئات إنفاق"
            />
          )}

          {selectedChartType === 'line' && (
            <LineChart
              data={getLineChartData()}
              width={width - 40}
              height={220}
              color="#10B981"
              showDots={true}
              showGrid={true}
              showLabels={true}
              showValues={false}
              title="المصاريف اليومية"
              suffix=" ر.س"
            />
          )}
        </View>

        {/* Weekly Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اتجاه المصاريف الأسبوعي</Text>
          <View style={styles.chartCard}>
            <BarChart
              data={reportData.weeklyExpenses.map((w) => ({
                label: w.week.replace('أسبوع ', ''),
                value: w.amount,
                color: '#3B82F6',
              }))}
              width={width - 72}
              height={180}
              barColor="#3B82F6"
              showValues={true}
              showGrid={true}
            />
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>رؤى مالية</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              <Text style={styles.insightValue}>{formatCurrency(reportData.dailyAverage)}</Text>
              <Text style={styles.insightLabel}>المعدل اليومي</Text>
            </View>
            <View style={styles.insightCard}>
              <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
              <Text style={styles.insightValue}>{reportData.topCategory}</Text>
              <Text style={styles.insightLabel}>أعلى فئة إنفاق</Text>
            </View>
          </View>
        </View>

        {/* Category Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الفئات</Text>
          <View style={styles.categoryList}>
            {reportData.categoryBreakdown.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}
                  >
                    <Text style={styles.categoryIconText}>{category.icon}</Text>
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{category.category}</Text>
                    <View style={styles.categoryBar}>
                      <View
                        style={[
                          styles.categoryBarFill,
                          { width: `${category.percentage}%`, backgroundColor: category.color },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.categoryAmountText}>
                    {formatCurrency(category.amount)} ر.س
                  </Text>
                  <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>نصائح لك</Text>
          <View style={styles.tipCard}>
            <View style={[styles.tipIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="bulb" size={24} color="#F59E0B" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>قلل من مصاريف الطعام</Text>
              <Text style={styles.tipText}>
                مصاريف الطعام تشكل 33% من إجمالي مصاريفك. جرب الطبخ في المنزل أكثر!
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <View style={[styles.tipIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>أداء ممتاز!</Text>
              <Text style={styles.tipText}>
                نسبة ادخارك {reportData.savingsRate}% وهي أعلى من المعدل الموصى به (20%)
              </Text>
            </View>
          </View>
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  periodButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  summaryAmountRed: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 4,
  },
  savingsCard: {
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
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  savingsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  savingsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 4,
  },
  savingsRate: {
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  savingsRateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  savingsRateLabel: {
    fontSize: 10,
    color: '#065F46',
    marginTop: 2,
  },
  savingsBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  savingsBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartTypeButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chartTypeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartTypeTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textAlign: 'right',
  },
  categoryBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  insightLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'right',
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'right',
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
});
