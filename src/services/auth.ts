import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';

// إكمال جلسة المتصفح
WebBrowser.maybeCompleteAuthSession();

// عنوان الـ API
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://app.riyalmind.com/api';

// مفاتيح التخزين
const STORAGE_KEYS = {
  AUTH_TOKEN: 'riyalmind_auth_token',
  REFRESH_TOKEN: 'riyalmind_refresh_token',
  USER: 'riyalmind_user',
};

// أنواع البيانات
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  subscription?: string;
  createdAt?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
}

/**
 * Hook للمصادقة بـ Google
 */
export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig?.extra?.googleClientId?.ios,
    androidClientId: Constants.expoConfig?.extra?.googleClientId?.android,
    webClientId: Constants.expoConfig?.extra?.googleClientId?.web,
  });

  /**
   * تسجيل الدخول بـ Google
   */
  const signIn = async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await promptAsync();

      if (result.type === 'success') {
        const { idToken, accessToken } = result.authentication || {};

        // إرسال التوكن للـ Backend
        const res = await fetch(`${API_URL}/auth/mobile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            accessToken,
            provider: 'google',
          }),
        });

        const data = await res.json();

        if (data.success) {
          // حفظ التوكنات محلياً
          await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, data.token);
          if (data.refreshToken) {
            await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
          }
          await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(data.user));

          return data.user;
        } else {
          setError(data.error || 'فشل تسجيل الدخول');
          return null;
        }
      } else if (result.type === 'cancel') {
        setError('تم إلغاء تسجيل الدخول');
        return null;
      } else {
        setError('فشل تسجيل الدخول');
        return null;
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    isLoading: isLoading || !request,
    error,
    isReady: !!request,
  };
};

/**
 * خدمة المصادقة الكاملة
 */
export const authService = {
  /**
   * جلب التوكن المحفوظ
   */
  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  /**
   * جلب المستخدم المحفوظ
   */
  getUser: async (): Promise<User | null> => {
    try {
      const userStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * التحقق من حالة تسجيل الدخول
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await authService.getToken();
    return !!token;
  },

  /**
   * تسجيل الخروج
   */
  signOut: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  /**
   * تجديد التوكن
   */
  refreshToken: async (): Promise<string | null> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        return null;
      }

      const res = await fetch(`${API_URL}/auth/mobile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await res.json();

      if (data.success) {
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, data.token);
        if (data.user) {
          await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(data.user));
        }
        return data.token;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  },

  /**
   * تحديث بيانات المستخدم
   */
  updateUser: async (user: User): Promise<void> => {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
  },
};

/**
 * Hook لإدارة حالة المصادقة
 */
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
  });

  // التحقق من حالة المصادقة عند التحميل
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [token, user] = await Promise.all([
        authService.getToken(),
        authService.getUser(),
      ]);

      setState({
        isAuthenticated: !!token && !!user,
        isLoading: false,
        user,
        token,
      });
    } catch (error) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
    });
  };

  const setUser = (user: User, token: string) => {
    setState({
      isAuthenticated: true,
      isLoading: false,
      user,
      token,
    });
  };

  return {
    ...state,
    checkAuth,
    signOut,
    setUser,
  };
};
