import { useState, useEffect, useCallback } from 'react';
import {
  initializeOfflineService,
  getIsOnline,
  addNetworkListener,
  getPendingSync,
  syncPendingChanges,
  downloadAllData,
  getLastSyncTime,
  PendingSyncItem,
} from '../services/offline';

export interface UseOfflineResult {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  downloadData: () => Promise<void>;
}

export function useOffline(): UseOfflineResult {
  const [isOnline, setIsOnline] = useState(getIsOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize and listen for network changes
  useEffect(() => {
    initializeOfflineService();

    const unsubscribe = addNetworkListener((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  // Load pending count and last sync time
  useEffect(() => {
    const loadStatus = async () => {
      const pending = await getPendingSync();
      setPendingCount(pending.length);

      const lastSync = await getLastSyncTime();
      setLastSyncTime(lastSync ? new Date(lastSync) : null);
    };

    loadStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync pending changes
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncPendingChanges();
      const pending = await getPendingSync();
      setPendingCount(pending.length);

      const lastSync = await getLastSyncTime();
      setLastSyncTime(lastSync ? new Date(lastSync) : null);

      console.log(`Sync complete: ${result.success} success, ${result.failed} failed`);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Download all data for offline use
  const downloadData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await downloadAllData();
      const lastSync = await getLastSyncTime();
      setLastSyncTime(lastSync ? new Date(lastSync) : null);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  return {
    isOnline,
    pendingCount,
    lastSyncTime,
    isSyncing,
    syncNow,
    downloadData,
  };
}

// Format last sync time for display
export function formatLastSync(date: Date | null): string {
  if (!date) return 'لم تتم المزامنة بعد';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
}
