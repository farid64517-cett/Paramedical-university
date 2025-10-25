-- ============================================
-- إعداد سريع للجداول الأساسية
-- ============================================

-- 1. إنشاء جدول المستخدمين
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

-- 2. تفعيل Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. السماح للمستخدمين بقراءة معلوماتهم الخاصة
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 4. السماح للمستخدمين بقراءة معلومات المعلمين
CREATE POLICY "Public can view teachers" ON public.users
    FOR SELECT USING (role = 'teacher' AND is_active = true);

-- 5. السماح للمستخدمين بتحديث معلوماتهم
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 6. السماح بإنشاء مستخدم جديد عند التسجيل
CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. دالة لإنشاء مستخدم جديد تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. إزالة التريجر القديم إن وجد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 9. إنشاء التريجر لإضافة المستخدمين الجدد تلقائياً
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. تحديث دالة handle_new_user للتعامل مع Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        role,
        profile_image,
        email_verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        full_name = EXCLUDED.full_name,
        profile_image = COALESCE(EXCLUDED.profile_image, public.users.profile_image),
        email_verified = EXCLUDED.email_verified,
        last_login = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. إضافة المستخدمين الموجودين في auth.users إلى جدول users (إن وجدوا)
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id,
    email,
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        split_part(email, '@', 1)
    ),
    COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 12. التحقق من إنشاء الجدول
SELECT COUNT(*) as user_count FROM public.users;
