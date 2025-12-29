import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import debounce from 'lodash.debounce';

export interface Category {
  id: number;
  name: string;
  nameEn: string;
  icon: string;
}

export interface CategorizationResult {
  categoryId: number;
  category: Category | null;
  confidence: number;
  reasoning?: string;
}

export function useAutoCategory() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<CategorizationResult | null>(null);
  const [suggestions, setSuggestions] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debounced categorization function
  const debouncedCategorize = useRef(
    debounce(async (description: string, amount?: number) => {
      if (!description || description.length < 3) {
        setSuggestion(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post('/expenses/categorize', {
          description,
          amount,
        });

        if (response.success) {
          setSuggestion({
            categoryId: response.categoryId,
            category: response.category,
            confidence: response.confidence,
            reasoning: response.reasoning,
          });
        }
      } catch (err) {
        console.error('Auto-categorization error:', err);
        setError('فشل التصنيف التلقائي');
      } finally {
        setIsLoading(false);
      }
    }, 500)
  ).current;

  // Get category suggestion based on description
  const categorize = useCallback((description: string, amount?: number) => {
    debouncedCategorize(description, amount);
  }, [debouncedCategorize]);

  // Get category suggestions for autocomplete
  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await api.get(`/expenses/categorize?q=${encodeURIComponent(query)}&limit=5`);
      
      if (response.success) {
        setSuggestions(response.categories);
      }
    } catch (err) {
      console.error('Get suggestions error:', err);
    }
  }, []);

  // Get all categories
  const getAllCategories = useCallback(async (): Promise<Category[]> => {
    try {
      const response = await api.get('/expenses/categorize');
      
      if (response.success) {
        return response.categories;
      }
      return [];
    } catch (err) {
      console.error('Get all categories error:', err);
      return [];
    }
  }, []);

  // Record user correction for learning
  const recordCorrection = useCallback(async (
    description: string,
    suggestedCategoryId: number,
    actualCategoryId: number
  ) => {
    if (suggestedCategoryId === actualCategoryId) return;

    try {
      await api.put('/expenses/categorize', {
        description,
        suggestedCategoryId,
        actualCategoryId,
      });
    } catch (err) {
      console.error('Record correction error:', err);
    }
  }, []);

  // Clear suggestion
  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  return {
    isLoading,
    suggestion,
    suggestions,
    error,
    categorize,
    getSuggestions,
    getAllCategories,
    recordCorrection,
    clearSuggestion,
  };
}

// Local category data for offline use
export const LOCAL_CATEGORIES: Category[] = [
  { id: 1, name: 'طعام ومطاعم', nameEn: 'Food & Restaurants', icon: '🍔' },
  { id: 2, name: 'بنزين ووقود', nameEn: 'Gas & Fuel', icon: '⛽' },
  { id: 3, name: 'بقالة وسوبرماركت', nameEn: 'Groceries', icon: '🛒' },
  { id: 4, name: 'مواصلات', nameEn: 'Transportation', icon: '🚗' },
  { id: 5, name: 'فواتير وخدمات', nameEn: 'Bills & Utilities', icon: '📄' },
  { id: 6, name: 'تسوق', nameEn: 'Shopping', icon: '🛍️' },
  { id: 7, name: 'ترفيه', nameEn: 'Entertainment', icon: '🎬' },
  { id: 8, name: 'صحة وطبي', nameEn: 'Health & Medical', icon: '🏥' },
  { id: 9, name: 'تعليم', nameEn: 'Education', icon: '📚' },
  { id: 10, name: 'إيجار وسكن', nameEn: 'Rent & Housing', icon: '🏠' },
  { id: 11, name: 'توصيل', nameEn: 'Delivery', icon: '🛵' },
  { id: 12, name: 'شخصي', nameEn: 'Personal', icon: '👤' },
  { id: 13, name: 'هدايا وتبرعات', nameEn: 'Gifts & Donations', icon: '🎁' },
  { id: 14, name: 'سيارة', nameEn: 'Car', icon: '🚙' },
  { id: 15, name: 'أخرى', nameEn: 'Other', icon: '📦' },
];

// Get category by ID
export function getCategoryById(id: number): Category | undefined {
  return LOCAL_CATEGORIES.find(c => c.id === id);
}

// Simple local categorization based on keywords
export function localCategorize(description: string): number {
  const lowerDesc = description.toLowerCase();
  
  const keywordMap: Record<string, number> = {
    // Food
    'مطعم': 1, 'طعام': 1, 'أكل': 1, 'بيتزا': 1, 'برجر': 1, 'كافيه': 1, 'قهوة': 1,
    'ماكدونالدز': 1, 'كنتاكي': 1, 'بيك': 1, 'ستاربكس': 1,
    // Gas
    'بنزين': 2, 'وقود': 2, 'محطة': 2,
    // Groceries
    'بقالة': 3, 'سوبرماركت': 3, 'خضار': 3, 'بندة': 3, 'الدانوب': 3, 'كارفور': 3,
    // Transport
    'أوبر': 4, 'كريم': 4, 'تاكسي': 4, 'مواصلات': 4,
    // Bills
    'فاتورة': 5, 'كهرباء': 5, 'ماء': 5, 'إنترنت': 5, 'stc': 5, 'موبايلي': 5,
    // Shopping
    'تسوق': 6, 'ملابس': 6, 'نون': 6, 'أمازون': 6, 'جرير': 6,
    // Entertainment
    'سينما': 7, 'نتفلكس': 7, 'ألعاب': 7,
    // Health
    'صيدلية': 8, 'دواء': 8, 'طبيب': 8, 'مستشفى': 8,
    // Education
    'كتب': 9, 'دورة': 9, 'تعليم': 9,
    // Rent
    'إيجار': 10, 'سكن': 10,
    // Delivery
    'توصيل': 11, 'هنقرستيشن': 11, 'جاهز': 11, 'طلبات': 11,
    // Personal
    'حلاق': 12, 'صالون': 12, 'جيم': 12,
    // Gifts
    'هدية': 13, 'تبرع': 13, 'زكاة': 13,
    // Car
    'سيارة': 14, 'صيانة': 14, 'غسيل': 14,
  };

  for (const [keyword, categoryId] of Object.entries(keywordMap)) {
    if (lowerDesc.includes(keyword)) {
      return categoryId;
    }
  }

  return 15; // Other
}
