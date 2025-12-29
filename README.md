# 📱 RiyalMind Mobile App

تطبيق ريال مايند للهواتف الذكية - iOS و Android

## 🚀 البدء السريع

### المتطلبات
- Node.js 18+
- npm أو yarn أو pnpm
- Expo CLI
- iOS Simulator (Mac) أو Android Emulator

### التثبيت

```bash
# استنساخ المشروع
cd riyal-mind-mobile

# تثبيت الحزم
npm install

# تشغيل التطبيق
npm start
```

### التشغيل على الأجهزة

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

## 📁 هيكل المشروع

```
riyal-mind-mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── _layout.tsx    # Tabs layout
│   │   ├── index.tsx      # Home tab
│   │   ├── expenses.tsx   # Expenses tab
│   │   ├── reports.tsx    # Reports tab
│   │   └── profile.tsx    # Profile tab
│   ├── _layout.tsx        # Root layout
│   ├── quick-add.tsx      # Quick add modal
│   ├── scanner.tsx        # Receipt scanner
│   └── login.tsx          # Login screen
├── src/
│   ├── screens/           # Screen components
│   ├── components/        # Reusable components
│   ├── services/          # API & state management
│   │   ├── api.ts         # API client
│   │   └── store.ts       # Zustand stores
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utility functions
│   └── assets/            # Images, fonts, etc.
├── app.json               # Expo config
└── package.json           # Dependencies
```

## 🔧 الإعدادات

### ربط الـ API

عدّل ملف `src/services/api.ts`:

```typescript
const API_BASE_URL = 'https://app.riyalmind.com/api';
```

### إعداد Google OAuth

1. أنشئ مشروع في [Google Cloud Console](https://console.cloud.google.com)
2. فعّل Google Sign-In API
3. أضف Client IDs في `app.json`:

```json
{
  "expo": {
    "extra": {
      "googleClientId": {
        "ios": "YOUR_IOS_CLIENT_ID",
        "android": "YOUR_ANDROID_CLIENT_ID"
      }
    }
  }
}
```

## 📱 الشاشات الرئيسية

### 1. الرئيسية (Home)
- عرض الرصيد المتبقي
- الدخل والمصاريف
- إجراءات سريعة
- التنبيهات
- آخر المصاريف

### 2. إضافة سريعة (Quick Add)
- إدخال المبلغ بسرعة
- اختيار الفئة
- مبالغ سريعة محددة مسبقاً
- تكرار مصروف سابق

### 3. المصاريف (Expenses)
- قائمة جميع المصاريف
- فلترة حسب الفئة والتاريخ
- البحث
- تعديل وحذف

### 4. التقارير (Reports)
- التقرير الأسبوعي
- المقارنة الشهرية
- تصدير البيانات

### 5. حسابي (Profile)
- معلومات الحساب
- الإعدادات
- القروض والأقساط
- الأهداف

## 🎨 التصميم

### الألوان الرئيسية

```typescript
const colors = {
  primary: '#10B981',      // أخضر
  secondary: '#3B82F6',    // أزرق
  danger: '#EF4444',       // أحمر
  warning: '#F59E0B',      // برتقالي
  background: '#F9FAFB',   // رمادي فاتح
  text: '#111827',         // أسود
  textSecondary: '#6B7280', // رمادي
};
```

### الخطوط
- الخط الافتراضي للنظام (يدعم العربية)
- يمكن إضافة خطوط مخصصة في `app/_layout.tsx`

## 🔔 الإشعارات

### إعداد Push Notifications

```bash
# تثبيت expo-notifications
npx expo install expo-notifications
```

### طلب الصلاحيات

```typescript
import * as Notifications from 'expo-notifications';

const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};
```

## 📸 ماسح الفواتير

### إعداد الكاميرا

```bash
npx expo install expo-camera expo-image-picker
```

### الاستخدام

```typescript
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
```

## 🏗️ البناء والنشر

### بناء للإنتاج

```bash
# تثبيت EAS CLI
npm install -g eas-cli

# تسجيل الدخول
eas login

# بناء Android APK
eas build --platform android --profile preview

# بناء iOS
eas build --platform ios --profile preview
```

### النشر على المتاجر

```bash
# Android (Google Play)
eas submit --platform android

# iOS (App Store)
eas submit --platform ios
```

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
npm test

# اختبار على جهاز حقيقي
npx expo start --tunnel
```

## 📝 ملاحظات مهمة

1. **RTL Support**: التطبيق يدعم الاتجاه من اليمين لليسار (العربية)
2. **Offline Mode**: يمكن إضافة دعم العمل بدون إنترنت لاحقاً
3. **Haptic Feedback**: التطبيق يستخدم الاهتزاز للتفاعل
4. **Dark Mode**: يمكن إضافة الوضع المظلم

## 🔗 الروابط

- [Expo Documentation](https://docs.expo.dev)
- [React Native](https://reactnative.dev)
- [Expo Router](https://expo.github.io/router)

## 📄 الترخيص

MIT License - RiyalMind © 2024
