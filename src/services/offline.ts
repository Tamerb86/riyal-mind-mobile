import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import api from './api';

// Storage keys
const KEYS = {
  EXPENSES: 'riyalmind_offline_expenses',
  INCOME: 'riyalmind_offline_income',
  BUDGETS: 'riyalmind_offline_budgets',
  GOALS: 'riyalmind_offline_goals',
  CATEGORIES: 'riyalmind_offline_categories',
  PENDING_SYNC: 'riyalmind_pending_sync',
  LAST_SYNC: 'riyalmind_last_sync',
};

// Types
export interface PendingSyncItem {
  id: string;
  type: 'expense' | 'income' | 'budget' | 'goal';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export interface OfflineData {
  expenses: any[];
  income: any[];
  budgets: any[];
  goals: any[];
  categories: any[];
}

// Network state
let isOnline = true;
let networkListeners: ((online: boolean) => void)[] = [];

/**
 * Initialize offline service and network monitoring
 */
export async function initializeOfflineService(): Promise<void> {
  // Check initial network state
  const state = await NetInfo.fetch();
  isOnline = state.isConnected ?? true;

  // Listen for network changes
  NetInfo.addEventListener((state: NetInfoState) => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? true;

    // Notify listeners
    networkListeners.forEach(listener => listener(isOnline));

    // Auto-sync when coming back online
    if (!wasOnline && isOnline) {
      syncPendingChanges();
    }
  });
}

/**
 * Check if device is online
 */
export function getIsOnline(): boolean {
  return isOnline;
}

/**
 * Add network state listener
 */
export function addNetworkListener(listener: (online: boolean) => void): () => void {
  networkListeners.push(listener);
  return () => {
    networkListeners = networkListeners.filter(l => l !== listener);
  };
}

/**
 * Save data to offline storage
 */
export async function saveOfflineData(key: keyof typeof KEYS, data: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS[key], JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving offline ${key}:`, error);
  }
}

/**
 * Get data from offline storage
 */
export async function getOfflineData<T>(key: keyof typeof KEYS): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS[key]);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting offline ${key}:`, error);
    return [];
  }
}

/**
 * Add item to pending sync queue
 */
export async function addToPendingSync(item: Omit<PendingSyncItem, 'id' | 'timestamp'>): Promise<void> {
  try {
    const pending = await getPendingSync();
    const newItem: PendingSyncItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    pending.push(newItem);
    await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(pending));
  } catch (error) {
    console.error('Error adding to pending sync:', error);
  }
}

/**
 * Get pending sync items
 */
export async function getPendingSync(): Promise<PendingSyncItem[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PENDING_SYNC);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting pending sync:', error);
    return [];
  }
}

/**
 * Remove item from pending sync
 */
export async function removeFromPendingSync(id: string): Promise<void> {
  try {
    const pending = await getPendingSync();
    const filtered = pending.filter(item => item.id !== id);
    await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from pending sync:', error);
  }
}

/**
 * Sync pending changes with server
 */
export async function syncPendingChanges(): Promise<{ success: number; failed: number }> {
  if (!isOnline) {
    return { success: 0, failed: 0 };
  }

  const pending = await getPendingSync();
  let success = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      switch (item.action) {
        case 'create':
          await api.post(`/${item.type}s`, item.data);
          break;
        case 'update':
          await api.put(`/${item.type}s/${item.data.id}`, item.data);
          break;
        case 'delete':
          await api.delete(`/${item.type}s/${item.data.id}`);
          break;
      }
      await removeFromPendingSync(item.id);
      success++;
    } catch (error) {
      console.error(`Failed to sync ${item.type}:`, error);
      failed++;
    }
  }

  // Update last sync time
  if (success > 0) {
    await AsyncStorage.setItem(KEYS.LAST_SYNC, Date.now().toString());
  }

  return { success, failed };
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp) : null;
  } catch {
    return null;
  }
}

/**
 * Download all data for offline use
 */
export async function downloadAllData(): Promise<void> {
  if (!isOnline) {
    throw new Error('Cannot download data while offline');
  }

  try {
    // Fetch all data in parallel
    const [expensesRes, incomeRes, budgetsRes, goalsRes] = await Promise.all([
      api.get('/expenses?limit=500'),
      api.get('/income?limit=100'),
      api.get('/budgets'),
      api.get('/goals'),
    ]);

    // Save to offline storage
    await Promise.all([
      saveOfflineData('EXPENSES', expensesRes.data.expenses || []),
      saveOfflineData('INCOME', incomeRes.data.income || []),
      saveOfflineData('BUDGETS', budgetsRes.data.budgets || []),
      saveOfflineData('GOALS', goalsRes.data.goals || []),
    ]);

    // Update last sync time
    await AsyncStorage.setItem(KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error('Error downloading data:', error);
    throw error;
  }
}

/**
 * Get all offline data
 */
export async function getAllOfflineData(): Promise<OfflineData> {
  const [expenses, income, budgets, goals, categories] = await Promise.all([
    getOfflineData<any>('EXPENSES'),
    getOfflineData<any>('INCOME'),
    getOfflineData<any>('BUDGETS'),
    getOfflineData<any>('GOALS'),
    getOfflineData<any>('CATEGORIES'),
  ]);

  return { expenses, income, budgets, goals, categories };
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.EXPENSES,
      KEYS.INCOME,
      KEYS.BUDGETS,
      KEYS.GOALS,
      KEYS.CATEGORIES,
      KEYS.PENDING_SYNC,
      KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}

/**
 * Create expense (with offline support)
 */
export async function createExpenseOffline(expense: any): Promise<any> {
  const tempId = `temp_${Date.now()}`;
  const expenseWithId = { ...expense, id: tempId, isOffline: true };

  // Add to local storage
  const expenses = await getOfflineData<any>('EXPENSES');
  expenses.unshift(expenseWithId);
  await saveOfflineData('EXPENSES', expenses);

  if (isOnline) {
    try {
      const result = await api.post('/expenses', expense);
      // Update local storage with real ID
      const updated = expenses.map(e => e.id === tempId ? { ...result, isOffline: false } : e);
      await saveOfflineData('EXPENSES', updated);
      return result;
    } catch (error) {
      // Add to pending sync
      await addToPendingSync({
        type: 'expense',
        action: 'create',
        data: expense,
      });
      return expenseWithId;
    }
  } else {
    // Add to pending sync
    await addToPendingSync({
      type: 'expense',
      action: 'create',
      data: expense,
    });
    return expenseWithId;
  }
}

/**
 * Get expenses (with offline fallback)
 */
export async function getExpensesOffline(params?: any): Promise<any[]> {
  if (isOnline) {
    try {
      const result = await api.get('/expenses', { params });
      const expenses = result.data.expenses || [];
      await saveOfflineData('EXPENSES', expenses);
      return expenses;
    } catch (error) {
      // Fallback to offline data
      return getOfflineData('EXPENSES');
    }
  } else {
    return getOfflineData('EXPENSES');
  }
}

/**
 * Delete expense (with offline support)
 */
export async function deleteExpenseOffline(id: string): Promise<void> {
  // Remove from local storage
  const expenses = await getOfflineData<any>('EXPENSES');
  const filtered = expenses.filter(e => e.id !== id);
  await saveOfflineData('EXPENSES', filtered);

  if (isOnline) {
    try {
      await api.delete(`/expenses/${id}`);
    } catch (error) {
      // Add to pending sync if not a temp ID
      if (!id.startsWith('temp_')) {
        await addToPendingSync({
          type: 'expense',
          action: 'delete',
          data: { id },
        });
      }
    }
  } else {
    // Add to pending sync if not a temp ID
    if (!id.startsWith('temp_')) {
      await addToPendingSync({
        type: 'expense',
        action: 'delete',
        data: { id },
      });
    }
  }
}
