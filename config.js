// Supabase Configuration
const SUPABASE_URL = 'https://sjkhvzgxswjzhgsvzrac.supabase.co';
// استخدم anon key من لوحة تحكم Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqa2h2emd4c3dqemhnc3Z6cmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzAwNjQsImV4cCI6MjA3Njk0NjA2NH0.ZeyFRhzjm7X3YIipZI_cNQQzeAPnl3CZyVy0NeMDTe0';

// Initialize Supabase Client with enhanced options
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: window.localStorage
    }
});

// Check if user is logged in with session validation
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Session error:', error);
            return null;
        }
        if (session && session.user) {
            // Validate session is not expired
            const expiresAt = new Date(session.expires_at * 1000);
            if (expiresAt > new Date()) {
                return session.user;
            } else {
                // Session expired, try to refresh
                const { data: { session: newSession } } = await supabase.auth.refreshSession();
                return newSession?.user || null;
            }
        }
        return null;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Logout function with session cleanup
async function logout() {
    try {
        // Clear local storage
        localStorage.removeItem('supabase.auth.token');
        
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
            // Force logout even if there's an error
            localStorage.clear();
        }
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Format date to Arabic
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Enhanced error handler with user-friendly messages
function handleAuthError(error) {
    const errorMessages = {
        'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        'Email not confirmed': 'يرجى تأكيد بريدك الإلكتروني أولاً',
        'User already registered': 'هذا البريد الإلكتروني مسجل بالفعل',
        'Password should be at least': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        'Invalid email': 'البريد الإلكتروني غير صالح',
        'Network request failed': 'خطأ في الاتصال بالإنترنت',
        'rate_limit': 'تم تجاوز عدد المحاولات المسموح، يرجى المحاولة لاحقاً',
        'user_not_found': 'لم يتم العثور على المستخدم',
        'session_expired': 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
    };
    
    // Check for specific error messages
    for (const [key, message] of Object.entries(errorMessages)) {
        if (error.message && error.message.toLowerCase().includes(key.toLowerCase())) {
            return message;
        }
    }
    
    // Return generic error message if no match
    return error.message || 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى';
}

// Get redirect URL based on environment
function getRedirectUrl(path = '') {
    const baseUrl = window.location.origin;
    return `${baseUrl}${path}`;
}

// Initialize auth state listener
function initAuthListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_IN' && session) {
            // Store session in localStorage
            localStorage.setItem('auth_session', JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                user_id: session.user.id
            }));
        } else if (event === 'SIGNED_OUT') {
            // Clear session from localStorage
            localStorage.removeItem('auth_session');
        } else if (event === 'TOKEN_REFRESHED' && session) {
            // Update stored session
            localStorage.setItem('auth_session', JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                user_id: session.user.id
            }));
        }
    });
}
