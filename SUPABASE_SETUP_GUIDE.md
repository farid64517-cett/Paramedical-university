# دليل إعداد Supabase للمنصة التعليمية

## 🔧 الإعدادات المطلوبة في Supabase Dashboard

### 1. إعداد Google OAuth

#### الخطوات:
1. اذهب إلى **Authentication > Providers** في لوحة تحكم Supabase
2. ابحث عن **Google** وقم بتفعيله
3. احصل على **Client ID** و **Client Secret** من Google Cloud Console

#### إعداد Google Cloud Console:
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعّل **Google+ API**
4. اذهب إلى **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. اختر **Web application**
6. أضف هذه URLs:

**Authorized JavaScript origins:**
```
http://localhost
http://localhost:3000
http://localhost:5000
http://127.0.0.1
https://sjkhvzgxswjzhgsvzrac.supabase.co
[YOUR_PRODUCTION_DOMAIN]
```

**Authorized redirect URIs:**
```
https://sjkhvzgxswjzhgsvzrac.supabase.co/auth/v1/callback
http://localhost/auth-callback.html
http://localhost:3000/auth-callback.html
http://localhost:5000/auth-callback.html
[YOUR_PRODUCTION_DOMAIN]/auth-callback.html
```

7. انسخ **Client ID** و **Client Secret**
8. الصقهما في Supabase Dashboard

### 2. إعداد قاعدة البيانات

#### جدول المستخدمين (users):
```sql
-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    phone TEXT,
    university TEXT,
    department TEXT,
    year_of_study INTEGER,
    profile_image TEXT,
    bio TEXT,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- تفعيل RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
-- السماح للمستخدمين بقراءة بياناتهم الخاصة
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- السماح للمستخدمين بتحديث بياناتهم الخاصة
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- السماح للمعلمين بعرض معلومات الطلاب
CREATE POLICY "Teachers can view students" 
ON public.users FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'teacher'
    )
);

-- السماح بإنشاء مستخدمين جدد
CREATE POLICY "Enable insert for authenticated users only" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);
```

#### جدول سجل النشاطات (activity_log):
```sql
-- إنشاء جدول سجل النشاطات
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث السريع
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at);

-- تفعيل RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للمستخدمين بإضافة سجلات نشاطهم
CREATE POLICY "Users can insert own activity" 
ON public.activity_log FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- سياسة للسماح للمستخدمين بعرض سجلات نشاطهم
CREATE POLICY "Users can view own activity" 
ON public.activity_log FOR SELECT 
USING (auth.uid() = user_id);
```

### 3. إعدادات Authentication

#### في Supabase Dashboard:
1. اذهب إلى **Authentication > Settings**
2. قم بتعيين هذه الإعدادات:

**Site URL:**
```
http://localhost:5000
```
أو عنوان موقعك في الإنتاج

**Redirect URLs (السماح بهذه العناوين):**
```
http://localhost/auth-callback.html
http://localhost:3000/auth-callback.html
http://localhost:5000/auth-callback.html
http://127.0.0.1/auth-callback.html
[YOUR_PRODUCTION_DOMAIN]/auth-callback.html
```

**JWT Expiry:**
- قم بتعيينه إلى `3600` ثانية (ساعة واحدة) أو حسب احتياجك

**Enable Email Confirmations:**
- قم بتفعيله إذا كنت تريد التحقق من البريد الإلكتروني

### 4. إعدادات SMTP (للبريد الإلكتروني)

#### استخدام Gmail:
1. اذهب إلى **Authentication > Settings > SMTP Settings**
2. قم بتعيين:
   - **Host:** smtp.gmail.com
   - **Port:** 587
   - **Username:** your-email@gmail.com
   - **Password:** [App Password من Google]
   - **Sender email:** your-email@gmail.com
   - **Sender name:** منصة الدروس الجامعية

#### للحصول على App Password من Google:
1. اذهب إلى [Google Account Settings](https://myaccount.google.com/)
2. Security > 2-Step Verification (يجب تفعيله)
3. App passwords > Generate new app password

### 5. Storage Buckets (للملفات)

```sql
-- إنشاء bucket للملفات التعليمية
INSERT INTO storage.buckets (id, name, public)
VALUES ('lessons', 'lessons', true);

-- إنشاء bucket لصور الملفات الشخصية
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- سياسات Storage
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 6. Edge Functions (اختياري)

لإضافة وظائف متقدمة مثل إرسال رسائل ترحيب:

```typescript
// supabase/functions/welcome-email/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'

serve(async (req) => {
  const { user } = await req.json()
  
  // Send welcome email logic here
  
  return new Response(
    JSON.stringify({ message: 'Welcome email sent!' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

## 🚀 اختبار الإعدادات

### 1. اختبار الاتصال:
```javascript
// في console المتصفح
const { data, error } = await supabase.auth.getSession()
console.log('Session:', data)
console.log('Error:', error)
```

### 2. اختبار Google OAuth:
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
})
console.log('OAuth Result:', data, error)
```

### 3. اختبار قاعدة البيانات:
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
console.log('Users:', data)
console.log('Error:', error)
```

## ⚠️ حل المشاكل الشائعة

### 1. خطأ "Invalid Redirect URL":
- تأكد من إضافة جميع URLs في Redirect URLs في Supabase
- تأكد من تطابق URL تماماً (بما في ذلك http/https)

### 2. خطأ "Google OAuth Error":
- تأكد من تفعيل Google Provider في Supabase
- تأكد من صحة Client ID و Client Secret
- تأكد من إضافة Redirect URI في Google Console

### 3. خطأ "Table 'users' does not exist":
- قم بتنفيذ SQL queries أعلاه في SQL Editor في Supabase

### 4. خطأ "Session not found":
- تأكد من تفعيل `persistSession: true` في إعدادات Supabase Client
- تأكد من استخدام `getSession()` بدلاً من `getUser()`

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من [Supabase Documentation](https://supabase.com/docs)
2. تحقق من Logs في Supabase Dashboard
3. استخدم Supabase Support Chat في Dashboard
