import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'riyalmind_biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'riyalmind_biometric_credentials';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnabled: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | 'none';
  hasCredentials: boolean;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<{
  isAvailable: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | 'none';
}> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware || !isEnrolled) {
      return { isAvailable: false, biometricType: 'none' };
    }

    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    let biometricType: 'fingerprint' | 'facial' | 'iris' | 'none' = 'none';
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'facial';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
    }

    return { isAvailable: true, biometricType };
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return { isAvailable: false, biometricType: 'none' };
  }
}

/**
 * Get full biometric status
 */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  const { isAvailable, biometricType } = await checkBiometricAvailability();
  
  const isEnabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY) === 'true';
  const credentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  
  return {
    isAvailable,
    isEnabled: isAvailable && isEnabled,
    biometricType,
    hasCredentials: !!credentials,
  };
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(
  reason: string = 'تسجيل الدخول إلى RiyalMind'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { isAvailable } = await checkBiometricAvailability();
    
    if (!isAvailable) {
      return { success: false, error: 'البصمة غير متاحة على هذا الجهاز' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'إلغاء',
      fallbackLabel: 'استخدام كلمة المرور',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      let errorMessage = 'فشل التحقق';
      
      if (result.error === 'user_cancel') {
        errorMessage = 'تم الإلغاء';
      } else if (result.error === 'user_fallback') {
        errorMessage = 'استخدم كلمة المرور';
      } else if (result.error === 'lockout') {
        errorMessage = 'تم قفل البصمة. حاول لاحقاً';
      }
      
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return { success: false, error: 'حدث خطأ أثناء التحقق' };
  }
}

/**
 * Enable biometric authentication
 */
export async function enableBiometricAuth(authToken: string): Promise<boolean> {
  try {
    // First, verify biometrics work
    const authResult = await authenticateWithBiometrics('تفعيل تسجيل الدخول بالبصمة');
    
    if (!authResult.success) {
      return false;
    }

    // Store credentials securely
    await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, authToken);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    
    return true;
  } catch (error) {
    console.error('Error enabling biometric auth:', error);
    return false;
  }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometricAuth(): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
    return true;
  } catch (error) {
    console.error('Error disabling biometric auth:', error);
    return false;
  }
}

/**
 * Get stored credentials after biometric authentication
 */
export async function getCredentialsWithBiometrics(): Promise<string | null> {
  try {
    const authResult = await authenticateWithBiometrics();
    
    if (!authResult.success) {
      return null;
    }

    const credentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    return credentials;
  } catch (error) {
    console.error('Error getting credentials:', error);
    return null;
  }
}

/**
 * Get biometric type display name in Arabic
 */
export function getBiometricTypeName(type: 'fingerprint' | 'facial' | 'iris' | 'none'): string {
  switch (type) {
    case 'facial':
      return 'Face ID';
    case 'fingerprint':
      return 'بصمة الإصبع';
    case 'iris':
      return 'بصمة العين';
    default:
      return 'غير متاح';
  }
}

/**
 * Get biometric icon name
 */
export function getBiometricIcon(type: 'fingerprint' | 'facial' | 'iris' | 'none'): string {
  switch (type) {
    case 'facial':
      return 'scan-outline';
    case 'fingerprint':
      return 'finger-print';
    case 'iris':
      return 'eye-outline';
    default:
      return 'lock-closed';
  }
}
