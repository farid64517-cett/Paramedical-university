=====================================
تعليمات مهمة لإعداد المشروع
=====================================

⚠️ يجب عليك الحصول على ANON KEY الصحيح من Supabase:

1. اذهب إلى: https://app.supabase.com
2. سجل دخولك واختر مشروعك
3. اضغط على Settings من القائمة الجانبية
4. اضغط على API
5. انسخ المفتاح بجانب "anon public"
   ⚠️ لا تنسخ "service_role" أبداً!
6. افتح ملف config.js
7. استبدل YOUR_ANON_KEY_HERE بالمفتاح الذي نسخته

=====================================
SQL لإنشاء قاعدة البيانات:
=====================================

افتح SQL Editor في Supabase والصق:

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    phone TEXT,
    university TEXT,
    department TEXT,
    year_of_study INTEGER,
    profile_image TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

=====================================
