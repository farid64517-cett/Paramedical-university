/**
 * مدير المصادقة - Authentication Manager
 * يتعامل مع جميع عمليات تسجيل الدخول والخروج والتحقق من المستخدم
 */

class AuthManager {
    constructor() {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                storage: window.localStorage
            }
        });
        this.currentUser = null;
        this.userProfile = null;
        this.sessionCheckInterval = null;
        this.initializeAuth();
    }

    /**
     * تهيئة المصادقة والاستماع للتغييرات
     */
    async initializeAuth() {
        // الاستماع لتغييرات حالة المصادقة
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);
            
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                this.startSessionCheck();
                this.storeSession(session);
                this.handlePostLogin();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.userProfile = null;
                this.stopSessionCheck();
                this.clearSession();
                this.handlePostLogout();
            } else if (event === 'USER_UPDATED' && session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                this.storeSession(session);
            } else if (event === 'TOKEN_REFRESHED' && session) {
                this.storeSession(session);
            }
        });

        // التحقق من الجلسة الحالية
        const { data: { session }, error } = await this.supabase.auth.getSession();
        if (session && !error) {
            this.currentUser = session.user;
            await this.loadUserProfile();
            this.startSessionCheck();
            this.storeSession(session);
        } else {
            // محاولة استرجاع الجلسة من localStorage
            await this.restoreSession();
        }
    }

    /**
     * تحميل ملف تعريف المستخدم من قاعدة البيانات
     */
    async loadUserProfile() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                // إذا لم يكن المستخدم موجوداً في جدول users، قم بإنشائه
                if (error.code === 'PGRST116') {
                    console.log('User profile not found, creating...');
                    await this.createUserProfile();
                    // حاول التحميل مرة أخرى
                    const { data: newData, error: newError } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('id', this.currentUser.id)
                        .single();
                    
                    if (!newError) {
                        this.userProfile = newData;
                        return newData;
                    }
                }
                throw error;
            }
            
            this.userProfile = data;
            
            // تحديث آخر تسجيل دخول
            await this.updateLastLogin();
            
            return data;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }

    /**
     * إنشاء ملف تعريف المستخدم إذا لم يكن موجوداً
     */
    async createUserProfile() {
        if (!this.currentUser) return null;

        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            const profileData = {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                role: user.user_metadata?.role || 'student',
                created_at: new Date().toISOString(),
                is_active: true,
                email_verified: user.email_confirmed_at ? true : false
            };

            const { data, error } = await this.supabase
                .from('users')
                .insert(profileData)
                .select()
                .single();

            if (error) {
                console.error('Error creating user profile:', error);
                return null;
            }

            console.log('User profile created successfully:', data);
            return data;
        } catch (error) {
            console.error('Error in createUserProfile:', error);
            return null;
        }
    }

    /**
     * تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
     */
    async signInWithEmail(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً');
                }
                throw error;
            }

            // تسجيل النشاط
            await this.logActivity('تسجيل دخول بالبريد الإلكتروني');
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تسجيل الدخول باستخدام Google
     */
    async signInWithGoogle() {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth-callback.html`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Google sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * إنشاء حساب جديد
     */
    async signUp(email, password, userData) {
        try {
            // إنشاء المستخدم في auth.users
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: userData.fullName,
                        role: userData.role
                    },
                    emailRedirectTo: `${window.location.origin}/email-confirmation.html`
                }
            });

            if (authError) throw authError;

            // إنشاء ملف تعريف المستخدم في جدول users
            const { error: profileError } = await this.supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: email,
                    full_name: userData.fullName,
                    role: userData.role,
                    phone: userData.phone || null,
                    university: userData.university || null,
                    department: userData.department || null,
                    year_of_study: userData.yearOfStudy || null
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // حذف المستخدم من auth إذا فشل إنشاء الملف الشخصي
                await this.supabase.auth.admin.deleteUser(authData.user.id);
                throw profileError;
            }

            // تسجيل النشاط
            await this.logActivity('إنشاء حساب جديد');
            
            return { 
                success: true, 
                user: authData.user,
                message: 'تم إنشاء الحساب بنجاح. يرجى تأكيد بريدك الإلكتروني.' 
            };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تسجيل الخروج
     */
    async signOut() {
        try {
            // تسجيل النشاط قبل الخروج
            await this.logActivity('تسجيل خروج');
            
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * إعادة تعيين كلمة المرور
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;
            
            return { 
                success: true, 
                message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' 
            };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تحديث كلمة المرور
     */
    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            
            // تسجيل النشاط
            await this.logActivity('تحديث كلمة المرور');
            
            return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
        } catch (error) {
            console.error('Update password error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تحديث ملف تعريف المستخدم
     */
    async updateProfile(updates) {
        if (!this.currentUser) {
            return { success: false, error: 'لم يتم تسجيل الدخول' };
        }

        try {
            const { error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', this.currentUser.id);

            if (error) throw error;
            
            // إعادة تحميل الملف الشخصي
            await this.loadUserProfile();
            
            // تسجيل النشاط
            await this.logActivity('تحديث الملف الشخصي');
            
            return { success: true, message: 'تم تحديث الملف الشخصي بنجاح' };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * التحقق من حالة تسجيل الدخول
     */
    async checkAuth() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) {
                console.error('Auth check error:', error);
                return null;
            }
            if (session && session.user) {
                // التحقق من صلاحية الجلسة
                const expiresAt = new Date(session.expires_at * 1000);
                if (expiresAt > new Date()) {
                    return session.user;
                } else {
                    // محاولة تجديد الجلسة
                    const { data: { session: newSession } } = await this.supabase.auth.refreshSession();
                    if (newSession) {
                        this.storeSession(newSession);
                        return newSession.user;
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Check auth error:', error);
            return null;
        }
    }

    /**
     * الحصول على المستخدم الحالي
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * الحصول على ملف تعريف المستخدم
     */
    getUserProfile() {
        return this.userProfile;
    }

    /**
     * التحقق من دور المستخدم
     */
    hasRole(role) {
        return this.userProfile?.role === role;
    }

    /**
     * التحقق من الصلاحيات
     */
    canAccess(resource) {
        if (!this.userProfile) return false;
        
        const permissions = {
            'teacher': ['dashboard', 'lessons', 'students', 'materials', 'analytics'],
            'student': ['lessons', 'enrollments', 'materials', 'progress'],
            'admin': ['*'] // جميع الصلاحيات
        };

        const userPermissions = permissions[this.userProfile.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(resource);
    }

    /**
     * تحديث آخر تسجيل دخول
     */
    async updateLastLogin() {
        if (!this.currentUser) return;

        try {
            await this.supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', this.currentUser.id);
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    /**
     * تسجيل النشاط
     */
    async logActivity(action, entityType = null, entityId = null, metadata = {}) {
        if (!this.currentUser) return;

        try {
            await this.supabase
                .from('activity_log')
                .insert({
                    user_id: this.currentUser.id,
                    action: action,
                    entity_type: entityType,
                    entity_id: entityId,
                    metadata: metadata,
                    ip_address: await this.getIPAddress(),
                    user_agent: navigator.userAgent
                });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    /**
     * الحصول على عنوان IP (يحتاج إلى API خارجي)
     */
    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return null;
        }
    }

    /**
     * معالجة ما بعد تسجيل الدخول
     */
    handlePostLogin() {
        // إعادة التوجيه بناءً على الدور
        if (this.userProfile) {
            if (this.userProfile.role === 'teacher') {
                if (!window.location.pathname.includes('teacher')) {
                    window.location.href = '/teacher-dashboard.html';
                }
            } else if (this.userProfile.role === 'student') {
                if (!window.location.pathname.includes('student')) {
                    window.location.href = '/student-lessons.html';
                }
            }
        }
    }

    /**
     * معالجة ما بعد تسجيل الخروج
     */
    handlePostLogout() {
        window.location.href = '/login.html';
    }

    /**
     * التحقق من تأكيد البريد الإلكتروني
     */
    async verifyEmail(token) {
        try {
            const { error } = await this.supabase.auth.verifyOtp({
                token_hash: token,
                type: 'email'
            });

            if (error) throw error;
            
            // تحديث حالة التحقق في قاعدة البيانات
            if (this.currentUser) {
                await this.supabase
                    .from('users')
                    .update({ email_verified: true })
                    .eq('id', this.currentUser.id);
            }
            
            return { success: true, message: 'تم تأكيد البريد الإلكتروني بنجاح' };
        } catch (error) {
            console.error('Email verification error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * إعادة إرسال بريد التأكيد
     */
    async resendConfirmationEmail(email) {
        try {
            const { error } = await this.supabase.auth.resend({
                type: 'signup',
                email: email
            });

            if (error) throw error;
            
            return { 
                success: true, 
                message: 'تم إرسال بريد التأكيد مرة أخرى' 
            };
        } catch (error) {
            console.error('Resend confirmation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * حفظ الجلسة في localStorage
     */
    storeSession(session) {
        if (session) {
            localStorage.setItem('supabase_session', JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                user: session.user
            }));
        }
    }

    /**
     * مسح الجلسة من localStorage
     */
    clearSession() {
        localStorage.removeItem('supabase_session');
        localStorage.removeItem('auth_session');
    }

    /**
     * استرجاع الجلسة من localStorage
     */
    async restoreSession() {
        try {
            const storedSession = localStorage.getItem('supabase_session');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);
                
                // التحقق من صلاحية الجلسة
                const expiresAt = new Date(sessionData.expires_at * 1000);
                if (expiresAt > new Date()) {
                    // محاولة تعيين الجلسة
                    const { data: { session }, error } = await this.supabase.auth.setSession({
                        access_token: sessionData.access_token,
                        refresh_token: sessionData.refresh_token
                    });
                    
                    if (session && !error) {
                        this.currentUser = session.user;
                        await this.loadUserProfile();
                        this.startSessionCheck();
                        return true;
                    }
                } else {
                    // الجلسة منتهية، محاولة التجديد
                    if (sessionData.refresh_token) {
                        const { data: { session } } = await this.supabase.auth.refreshSession({
                            refresh_token: sessionData.refresh_token
                        });
                        if (session) {
                            this.currentUser = session.user;
                            await this.loadUserProfile();
                            this.storeSession(session);
                            this.startSessionCheck();
                            return true;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Restore session error:', error);
        }
        return false;
    }

    /**
     * بدء فحص دوري للجلسة
     */
    startSessionCheck() {
        // فحص كل 5 دقائق
        this.stopSessionCheck();
        this.sessionCheckInterval = setInterval(async () => {
            const user = await this.checkAuth();
            if (!user) {
                console.log('Session expired, redirecting to login...');
                this.handlePostLogout();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * إيقاف فحص الجلسة
     */
    stopSessionCheck() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
    }
}

// إنشاء مثيل واحد من مدير المصادقة
const authManager = new AuthManager();

// تصدير للاستخدام في ملفات أخرى
window.authManager = authManager;
