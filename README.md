# منصة دروس الجامعة شبه الطبية - الجزائر

منصة تعليمية متكاملة لنشر ومشاركة الدروس الجامعية للتخصصات شبه الطبية.

## المميزات

- ✅ تسجيل الدخول بالبريد الإلكتروني و Google
- ✅ واجهة خاصة للأساتذة لرفع وإدارة الدروس
- ✅ رفع ملفات متعددة الصيغ (PDF, Word, صور, فيديو)
- ✅ حماية الدروس بكلمة مرور اختيارية
- ✅ صفحة للطلاب لتصفح وتحميل الدروس
- ✅ قاعدة بيانات سحابية باستخدام Supabase
- ✅ واجهة مستخدم حديثة وجذابة

## التقنيات المستخدمة

- **HTML5** - هيكل الصفحات
- **CSS3** - التصميم والتنسيق
- **JavaScript** - البرمجة والتفاعل
- **Supabase** - قاعدة البيانات والمصادقة
- **Font Awesome** - الأيقونات

## الملفات الرئيسية

- `index.html` - الصفحة الرئيسية
- `login.html` - صفحة تسجيل الدخول
- `register.html` - صفحة التسجيل
- `teacher-dashboard.html` - لوحة تحكم الأساتذة
- `student-lessons.html` - صفحة الدروس للطلاب
- `styles.css` - ملف التنسيقات
- `config.js` - إعدادات Supabase

### 2. إعداد Supabase

1. أنشئ حساب على [Supabase](https://supabase.com)
2. أنشئ مشروع جديد
3. انسخ `URL` و `Anon Key` من إعدادات المشروع

### 3. تكوين Supabase

افتح ملف `config.js` وأضف معلومات Supabase الخاصة بك:

```javascript
const SUPABASE_URL = 'your_supabase_url_here';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key_here';
```

### 4. إنشاء الجداول في Supabase

قم بتنفيذ الاستعلامات التالية في Supabase SQL Editor:

```sql
-- جدول المستخدمين
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('student', 'teacher', 'admin')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- جدول الدروس
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  password TEXT,
  is_protected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- جدول الملفات
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'word', 'image', 'video')) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- إنشاء Storage Bucket للملفات
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);
```

### 5. إعداد المصادقة بـ Google (اختياري)

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد أو استخدم مشروع موجود
3. فعّل Google OAuth 2.0
4. أضف معلومات OAuth في إعدادات Supabase Authentication

## تشغيل المشروع

1. افتح ملف `index.html` في المتصفح مباشرة
2. أو استخدم خادم محلي بسيط:

```bash
# باستخدام Python
python -m http.server 8000

# أو باستخدام Node.js
npx http-server
```

## هيكل المشروع

```
paramedical-lessons/
├── index.html              # الصفحة الرئيسية
├── login.html              # صفحة تسجيل الدخول
├── register.html           # صفحة التسجيل
├── teacher-dashboard.html  # لوحة تحكم الأساتذة
├── student-lessons.html    # صفحة الدروس للطلاب
├── styles.css              # ملف التنسيقات
├── config.js               # إعدادات Supabase
└── README.md               # دليل المشروع
```

## الاستخدام

### للأساتذة

1. سجل حساب جديد كأستاذ
2. سجل الدخول
3. من لوحة التحكم، يمكنك:
   - إضافة دروس جديدة
   - رفع ملفات (PDF, Word, صور, فيديو)
   - حماية الدروس بكلمة مرور
   - حذف أو تعديل الدروس

### للطلاب

1. سجل حساب جديد كطالب
2. سجل الدخول
3. تصفح الدروس المتاحة
4. ابحث عن الدروس حسب العنوان أو المادة
5. حمّل الملفات المرفقة
6. أدخل كلمة المرور للدروس المحمية

## الأمان

- كلمات المرور مشفرة باستخدام bcrypt
- المصادقة مُدارة بواسطة Supabase Auth
- الملفات محمية بواسطة Supabase Storage policies

## المساهمة

نرحب بالمساهمات! يرجى فتح issue أو pull request.

## الرخصة

MIT

## الدعم

للمساعدة أو الاستفسارات، يرجى التواصل عبر [البريد الإلكتروني]
