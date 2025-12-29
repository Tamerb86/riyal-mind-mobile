import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline, formatLastSync } from '../hooks/useOffline';

interface OfflineBannerProps {
  showSyncButton?: boolean;
}

export default function OfflineBanner({ showSyncButton = true }: OfflineBannerProps) {
  const { isOnline, pendingCount, lastSyncTime, isSyncing, syncNow } = useOffline();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? -60 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [isOnline]);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineContent}>
            <Ionicons name="cloud-offline" size={20} color="#FFFFFF" />
            <Text style={styles.offlineText}>أنت غير متصل بالإنترنت</Text>
          </View>
          <Text style={styles.offlineSubtext}>
            التغييرات ستُحفظ وتُزامن عند الاتصال
          </Text>
        </View>
      )}

      {/* Pending Sync Banner */}
      {isOnline && pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <View style={styles.pendingContent}>
            <Ionicons name="sync" size={20} color="#F59E0B" />
            <Text style={styles.pendingText}>
              {pendingCount} تغييرات في انتظار المزامنة
            </Text>
          </View>
          {showSyncButton && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={syncNow}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.syncButtonText}>مزامنة</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

// Compact version for headers
export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.indicator,
        !isOnline ? styles.indicatorOffline : styles.indicatorPending,
      ]}
      onPress={isOnline ? syncNow : undefined}
      disabled={isSyncing || !isOnline}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Ionicons
          name={isOnline ? 'sync' : 'cloud-offline'}
          size={16}
          color="#FFFFFF"
        />
      )}
      {pendingCount > 0 && isOnline && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Sync status for settings
export function SyncStatus() {
  const { isOnline, pendingCount, lastSyncTime, isSyncing, syncNow, downloadData } = useOffline();

  return (
    <View style={styles.syncStatus}>
      {/* Connection Status */}
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          <View style={[
            styles.statusDot,
            isOnline ? styles.statusOnline : styles.statusOffline,
          ]} />
          <Text style={styles.statusText}>
            {isOnline ? 'متصل بالإنترنت' : 'غير متصل'}
          </Text>
        </View>
      </View>

      {/* Last Sync */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>آخر مزامنة:</Text>
        <Text style={styles.statusValue}>{formatLastSync(lastSyncTime)}</Text>
      </View>

      {/* Pending Changes */}
      {pendingCount > 0 && (
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>تغييرات معلقة:</Text>
          <Text style={[styles.statusValue, styles.pendingValue]}>{pendingCount}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, !isOnline && styles.actionButtonDisabled]}
          onPress={syncNow}
          disabled={!isOnline || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="sync" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>مزامنة الآن</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton, !isOnline && styles.actionButtonDisabled]}
          onPress={downloadData}
          disabled={!isOnline || isSyncing}
        >
          <Ionicons name="cloud-download" size={18} color="#059669" />
          <Text style={[styles.actionButtonText, styles.downloadButtonText]}>
            تحميل البيانات
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  offlineBanner: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  offlineContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  pendingBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  pendingText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  indicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorOffline: {
    backgroundColor: '#EF4444',
  },
  indicatorPending: {
    backgroundColor: '#F59E0B',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  syncStatus: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusOffline: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  pendingValue: {
    color: '#F59E0B',
  },
  actionButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: '#D1FAE5',
  },
  downloadButtonText: {
    color: '#059669',
  },
});
