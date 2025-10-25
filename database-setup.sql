-- ============================================
-- إنشاء الجداول الأساسية للمنصة التعليمية
-- ============================================

-- 1. جدول المستخدمين (Users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    phone TEXT,
    university TEXT,
    department TEXT,
    year_of_study INTEGER CHECK (year_of_study >= 1 AND year_of_study <= 7),
    profile_image TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

-- 2. جدول الدروس (Lessons)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    year_level INTEGER NOT NULL CHECK (year_level >= 1 AND year_level <= 7),
    semester INTEGER CHECK (semester IN (1, 2)),
    price DECIMAL(10, 2) DEFAULT 0,
    duration_minutes INTEGER,
    video_url TEXT,
    thumbnail_url TEXT,
    materials JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول التسجيلات (Enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_accessed TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    UNIQUE(student_id, lesson_id)
);

-- 4. جدول المواد التعليمية (Materials)
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    download_count INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES public.users(id)
);

-- 5. جدول التعليقات (Comments)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول المدفوعات (Payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT,
    transaction_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. جدول الأنشطة (Activity Log)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- إنشاء الفهارس (Indexes) لتحسين الأداء
-- ============================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_lessons_teacher_id ON public.lessons(teacher_id);
CREATE INDEX idx_lessons_subject ON public.lessons(subject);
CREATE INDEX idx_lessons_year_level ON public.lessons(year_level);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_lesson_id ON public.enrollments(lesson_id);
CREATE INDEX idx_comments_lesson_id ON public.comments(lesson_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);

-- ============================================
-- تفعيل Row Level Security (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- قواعد RLS للجدول users
-- ============================================

-- السماح للمستخدمين بقراءة معلوماتهم الخاصة
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- السماح للمستخدمين بقراءة معلومات المعلمين العامة
CREATE POLICY "Public can view teachers" ON public.users
    FOR SELECT USING (role = 'teacher' AND is_active = true);

-- السماح للمستخدمين بتحديث معلوماتهم الخاصة
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- السماح بإنشاء مستخدم جديد عند التسجيل
CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- قواعد RLS للجدول lessons
-- ============================================

-- السماح للجميع بقراءة الدروس المنشورة
CREATE POLICY "Public can view published lessons" ON public.lessons
    FOR SELECT USING (is_published = true);

-- السماح للمعلمين بقراءة دروسهم الخاصة
CREATE POLICY "Teachers can view own lessons" ON public.lessons
    FOR SELECT USING (teacher_id = auth.uid());

-- السماح للمعلمين بإنشاء دروس جديدة
CREATE POLICY "Teachers can create lessons" ON public.lessons
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher')
    );

-- السماح للمعلمين بتحديث دروسهم
CREATE POLICY "Teachers can update own lessons" ON public.lessons
    FOR UPDATE USING (teacher_id = auth.uid());

-- السماح للمعلمين بحذف دروسهم
CREATE POLICY "Teachers can delete own lessons" ON public.lessons
    FOR DELETE USING (teacher_id = auth.uid());

-- ============================================
-- قواعد RLS للجدول enrollments
-- ============================================

-- السماح للطلاب بقراءة تسجيلاتهم
CREATE POLICY "Students can view own enrollments" ON public.enrollments
    FOR SELECT USING (student_id = auth.uid());

-- السماح للمعلمين بقراءة التسجيلات في دروسهم
CREATE POLICY "Teachers can view lesson enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.lessons 
            WHERE lessons.id = enrollments.lesson_id 
            AND lessons.teacher_id = auth.uid()
        )
    );

-- السماح للطلاب بالتسجيل في الدروس
CREATE POLICY "Students can enroll in lessons" ON public.enrollments
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
    );

-- السماح للطلاب بتحديث تقدمهم
CREATE POLICY "Students can update own progress" ON public.enrollments
    FOR UPDATE USING (student_id = auth.uid());

-- ============================================
-- قواعد RLS للجدول materials
-- ============================================

-- السماح للطلاب المسجلين بقراءة المواد
CREATE POLICY "Enrolled students can view materials" ON public.materials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE enrollments.lesson_id = materials.lesson_id 
            AND enrollments.student_id = auth.uid()
        )
    );

-- السماح للمعلمين بإدارة المواد في دروسهم
CREATE POLICY "Teachers can manage lesson materials" ON public.materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.lessons 
            WHERE lessons.id = materials.lesson_id 
            AND lessons.teacher_id = auth.uid()
        )
    );

-- ============================================
-- قواعد RLS للجدول comments
-- ============================================

-- السماح للمستخدمين المسجلين بقراءة التعليقات
CREATE POLICY "Authenticated users can view comments" ON public.comments
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- السماح للمستخدمين بإنشاء تعليقات
CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- السماح للمستخدمين بتحديث تعليقاتهم
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (user_id = auth.uid());

-- السماح للمستخدمين بحذف تعليقاتهم
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- قواعد RLS للجدول notifications
-- ============================================

-- السماح للمستخدمين بقراءة إشعاراتهم فقط
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- السماح للنظام بإنشاء إشعارات
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- السماح للمستخدمين بتحديث إشعاراتهم (وضع علامة مقروء)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- السماح للمستخدمين بحذف إشعاراتهم
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- قواعد RLS للجدول payments
-- ============================================

-- السماح للطلاب بقراءة مدفوعاتهم
CREATE POLICY "Students can view own payments" ON public.payments
    FOR SELECT USING (student_id = auth.uid());

-- السماح للمعلمين بقراءة المدفوعات المتعلقة بدروسهم
CREATE POLICY "Teachers can view lesson payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.lessons 
            WHERE lessons.id = payments.lesson_id 
            AND lessons.teacher_id = auth.uid()
        )
    );

-- السماح بإنشاء المدفوعات للطلاب فقط
CREATE POLICY "Students can create payments" ON public.payments
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
    );

-- ============================================
-- قواعد RLS للجدول activity_log
-- ============================================

-- السماح للمستخدمين بقراءة سجل نشاطاتهم
CREATE POLICY "Users can view own activity" ON public.activity_log
    FOR SELECT USING (user_id = auth.uid());

-- السماح بإنشاء سجلات النشاط
CREATE POLICY "System can create activity logs" ON public.activity_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- إنشاء الدوال المساعدة (Functions)
-- ============================================

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة على الجداول المطلوبة
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دالة لإنشاء مستخدم جديد تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تطبيق الدالة عند إنشاء مستخدم جديد في auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- دالة لتسجيل النشاطات
CREATE OR REPLACE FUNCTION log_activity(
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لحساب إحصائيات المعلم
CREATE OR REPLACE FUNCTION get_teacher_stats(teacher_uuid UUID)
RETURNS TABLE (
    total_lessons BIGINT,
    total_students BIGINT,
    total_revenue NUMERIC,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT l.id) AS total_lessons,
        COUNT(DISTINCT e.student_id) AS total_students,
        COALESCE(SUM(p.amount), 0) AS total_revenue,
        COALESCE(AVG(l.rating), 0) AS average_rating
    FROM public.lessons l
    LEFT JOIN public.enrollments e ON l.id = e.lesson_id
    LEFT JOIN public.payments p ON l.id = p.lesson_id AND p.status = 'completed'
    WHERE l.teacher_id = teacher_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لحساب إحصائيات الطالب
CREATE OR REPLACE FUNCTION get_student_stats(student_uuid UUID)
RETURNS TABLE (
    total_enrolled_lessons BIGINT,
    completed_lessons BIGINT,
    in_progress_lessons BIGINT,
    total_spent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.lesson_id) AS total_enrolled_lessons,
        COUNT(DISTINCT CASE WHEN e.is_completed THEN e.lesson_id END) AS completed_lessons,
        COUNT(DISTINCT CASE WHEN NOT e.is_completed THEN e.lesson_id END) AS in_progress_lessons,
        COALESCE(SUM(p.amount), 0) AS total_spent
    FROM public.enrollments e
    LEFT JOIN public.payments p ON e.lesson_id = p.lesson_id 
        AND e.student_id = p.student_id 
        AND p.status = 'completed'
    WHERE e.student_id = student_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- إنشاء Views للتقارير والإحصائيات
-- ============================================

-- عرض للدروس مع معلومات المعلم
CREATE OR REPLACE VIEW public.lessons_with_teacher AS
SELECT 
    l.*,
    u.full_name AS teacher_name,
    u.profile_image AS teacher_image,
    u.department AS teacher_department,
    COUNT(DISTINCT e.student_id) AS enrolled_count
FROM public.lessons l
JOIN public.users u ON l.teacher_id = u.id
LEFT JOIN public.enrollments e ON l.id = e.lesson_id
GROUP BY l.id, u.full_name, u.profile_image, u.department;

-- عرض لتقدم الطلاب
CREATE OR REPLACE VIEW public.student_progress AS
SELECT 
    e.*,
    l.title AS lesson_title,
    l.subject AS lesson_subject,
    l.year_level AS lesson_year,
    u.full_name AS student_name
FROM public.enrollments e
JOIN public.lessons l ON e.lesson_id = l.id
JOIN public.users u ON e.student_id = u.id;

-- ============================================
-- إدراج بيانات تجريبية (اختياري)
-- ============================================

-- يمكنك إضافة بيانات تجريبية هنا إذا أردت
-- INSERT INTO public.users (id, email, full_name, role) VALUES ...
