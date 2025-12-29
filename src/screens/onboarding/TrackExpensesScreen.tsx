import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface TrackExpensesScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export default function TrackExpensesScreen({ onNext, onBack }: TrackExpensesScreenProps) {
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
          <View style={styles.illustration}>
            <View style={styles.phoneFrame}>
              {/* Mock expense list */}
              <View style={styles.mockHeader}>
                <Text style={styles.mockTitle}>المصاريف</Text>
              </View>
              <View style={styles.mockExpense}>
                <View style={[styles.mockIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Text>🍔</Text>
                </View>
                <View style={styles.mockExpenseText}>
                  <Text style={styles.mockExpenseName}>طعام</Text>
                  <Text style={styles.mockExpenseAmount}>-150 ر.س</Text>
                </View>
              </View>
              <View style={styles.mockExpense}>
                <View style={[styles.mockIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Text>⛽</Text>
                </View>
                <View style={styles.mockExpenseText}>
                  <Text style={styles.mockExpenseName}>بنزين</Text>
                  <Text style={styles.mockExpenseAmount}>-200 ر.س</Text>
                </View>
              </View>
              <View style={styles.mockExpense}>
                <View style={[styles.mockIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Text>🛒</Text>
                </View>
                <View style={styles.mockExpenseText}>
                  <Text style={styles.mockExpenseName}>بقالة</Text>
                  <Text style={styles.mockExpenseAmount}>-320 ر.س</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text style={styles.title}>سجّل مصاريفك بسهولة</Text>
          <Text style={styles.description}>
            أضف مصاريفك بضغطة واحدة مع التصنيف التلقائي{'\n'}
            بالذكاء الاصطناعي. لا حاجة للكتابة الكثيرة!
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>تصنيف تلقائي ذكي</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>إضافة سريعة بضغطة</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>مسح الفواتير بالكاميرا</Text>
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
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
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
    alignItems: 'center',
    marginTop: 24,
  },
  illustration: {
    width: width * 0.7,
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  mockHeader: {
    marginBottom: 16,
  },
  mockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  mockExpense: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mockIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  mockExpenseText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mockExpenseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  mockExpenseAmount: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 2,
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
