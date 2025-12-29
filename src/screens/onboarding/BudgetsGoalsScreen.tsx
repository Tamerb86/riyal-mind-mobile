import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface BudgetsGoalsScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export default function BudgetsGoalsScreen({ onNext, onBack }: BudgetsGoalsScreenProps) {
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-forward" size={24} color="#6B7280" />
        </TouchableOpacity>

        {/* Illustration */}
        <View style={styles.illustrationSection}>
          {/* Budget Card */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetTitle}>ميزانية الطعام</Text>
              <Text style={styles.budgetEmoji}>🍔</Text>
            </View>
            <View style={styles.budgetProgress}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '75%' }]} />
              </View>
              <View style={styles.budgetAmounts}>
                <Text style={styles.budgetSpent}>750 ر.س</Text>
                <Text style={styles.budgetTotal}>من 1,000 ر.س</Text>
              </View>
            </View>
            <View style={styles.budgetWarning}>
              <Ionicons name="alert-circle" size={16} color="#F59E0B" />
              <Text style={styles.warningText}>وصلت لـ 75% من الميزانية</Text>
            </View>
          </View>

          {/* Goal Card */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>هدف: iPhone جديد</Text>
              <Text style={styles.goalEmoji}>📱</Text>
            </View>
            <View style={styles.goalProgress}>
              <View style={styles.progressBarGoal}>
                <View style={[styles.progressFillGoal, { width: '60%' }]} />
              </View>
              <View style={styles.goalAmounts}>
                <Text style={styles.goalSaved}>3,000 ر.س</Text>
                <Text style={styles.goalTarget}>من 5,000 ر.س</Text>
              </View>
            </View>
            <Text style={styles.goalRemaining}>متبقي 2,000 ر.س</Text>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text style={styles.title}>تحكّم في ميزانيتك</Text>
          <Text style={styles.description}>
            ضع ميزانيات لكل فئة وتتبع تقدمك{'\n'}
            نحو أهدافك الادخارية بسهولة
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>تنبيهات عند اقتراب الميزانية</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>تتبع أهداف الادخار</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>تقارير شهرية مفصلة</Text>
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>التالي</Text>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  illustrationSection: {
    marginTop: 24,
    gap: 16,
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  budgetHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  budgetEmoji: {
    fontSize: 28,
  },
  budgetProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 6,
  },
  budgetAmounts: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetSpent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  budgetTotal: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  budgetWarning: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  goalEmoji: {
    fontSize: 28,
  },
  goalProgress: {
    marginBottom: 8,
  },
  progressBarGoal: {
    height: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFillGoal: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  goalAmounts: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goalSaved: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  goalTarget: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  goalRemaining: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },
  textSection: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  features: {
    marginTop: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#059669',
    width: 24,
  },
});
