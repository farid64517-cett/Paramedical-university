/**
 * مساعد إنشاء وإدارة المستخدمين
 * User Creation and Management Helper
 */

class UserHelper {
    constructor() {
        this.supabase = window.supabase;
    }

    /**
     * إنشاء أو تحديث ملف تعريف المستخدم
     * @param {Object} user - كائن المستخدم من Supabase Auth
     * @param {Object} additionalData - بيانات إضافية اختيارية
     */
    async createOrUpdateUserProfile(user, additionalData = {}) {
        if (!user) {
            console.error('No user provided');
            return { success: false, error: 'No user provided' };
        }

        try {
            // التحقق من وجود المستخدم
            const { data: existingUser, error: checkError } = await this.supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();

            if (existingUser) {
                // تحديث المستخدم الموجود
                const updateData = {
                    last_login: new Date().toISOString(),
                    ...additionalData
                };

                const { data, error } = await this.supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', user.id)
                    .select()
                    .single();

                if (error) throw error;

                return { 
                    success: true, 
                    data, 
                    message: 'تم تحديث ملف المستخدم بنجاح' 
                };
            } else {
                // إنشاء مستخدم جديد
                const profileData = {
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || additionalData.full_name || user.email.split('@')[0],
                    role: user.user_metadata?.role || additionalData.role || 'student',
                    phone: additionalData.phone || null,
                    university: additionalData.university || null,
                    department: additionalData.department || null,
                    year_of_study: additionalData.year_of_study || null,
                    created_at: new Date().toISOString(),
                    is_active: true,
                    email_verified: user.email_confirmed_at ? true : false
                };

                const { data, error } = await this.supabase
                    .from('users')
                    .insert(profileData)
                    .select()
                    .single();

                if (error) throw error;

                return { 
                    success: true, 
                    data, 
                    message: 'تم إنشاء ملف المستخدم بنجاح' 
                };
            }
        } catch (error) {
            console.error('Error in createOrUpdateUserProfile:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    /**
     * إنشاء مستخدم تجريبي للاختبار
     */
    async createTestUser() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (!user) {
                return { 
                    success: false, 
                    error: 'يجب تسجيل الدخول أولاً' 
                };
            }

            const testData = {
                full_name: 'مستخدم تجريبي',
                role: 'student',
                phone: '0555555555',
                university: 'جامعة تجريبية',
                department: 'قسم تجريبي',
                year_of_study: 1
            };

            return await this.createOrUpdateUserProfile(user, testData);
        } catch (error) {
            console.error('Error creating test user:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    /**
     * التحقق من وجود ملف المستخدم
     */
    async checkUserProfile(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return {
                exists: !!data,
                data: data || null
            };
        } catch (error) {
            console.error('Error checking user profile:', error);
            return {
                exists: false,
                data: null,
                error: error.message
            };
        }
    }

    /**
     * مزامنة المستخدم بعد تسجيل الدخول
     * يتم استدعاؤها تلقائياً بعد تسجيل الدخول الناجح
     */
    async syncUserAfterLogin() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (!user) {
                console.log('No user to sync');
                return;
            }

            const result = await this.createOrUpdateUserProfile(user);
            
            if (result.success) {
                console.log('User synced successfully:', result.data);
            } else {
                console.error('Failed to sync user:', result.error);
            }

            return result;
        } catch (error) {
            console.error('Error in syncUserAfterLogin:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
}

// إنشاء نسخة عامة من المساعد
window.userHelper = new UserHelper();

// مثال على الاستخدام:
/*
// بعد تسجيل الدخول الناجح:
const { data: { user } } = await supabase.auth.getUser();
const result = await userHelper.createOrUpdateUserProfile(user, {
    full_name: 'اسم المستخدم',
    role: 'student',
    university: 'جامعة الملك سعود'
});

if (result.success) {
    console.log('User profile created/updated:', result.data);
} else {
    console.error('Error:', result.error);
}
*/
