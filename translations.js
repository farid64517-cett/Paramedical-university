// Translation system for multi-language support
const translations = {
    ar: {
        // Header
        platformName: "منصة الدروس الجامعية",
        lessons: "الدروس",
        profile: "الملف الشخصي",
        logout: "تسجيل الخروج",
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        
        // Profile Page
        profileTitle: "الملف الشخصي",
        loading: "جاري تحميل البيانات...",
        userId: "معرف المستخدم",
        registrationDate: "تاريخ التسجيل",
        lastLogin: "آخر تسجيل دخول",
        role: "الدور",
        student: "طالب",
        teacher: "معلم",
        admin: "مدير",
        goToLessons: "الذهاب إلى الدروس",
        editProfile: "تعديل الملف الشخصي",
        editFeatureComingSoon: "ميزة التعديل قيد التطوير",
        
        // Login Page
        loginTitle: "تسجيل الدخول",
        loginDescription: "أدخل بياناتك للوصول إلى حسابك",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        rememberMe: "تذكرني",
        forgotPassword: "نسيت كلمة المرور؟",
        noAccount: "ليس لديك حساب؟",
        createAccount: "أنشئ حساباً جديداً",
        or: "أو",
        loginWithGoogle: "تسجيل الدخول بواسطة Google",
        
        // Register Page
        registerTitle: "إنشاء حساب جديد",
        registerDescription: "أنشئ حسابك للبدء في التعلم",
        fullName: "الاسم الكامل",
        confirmPassword: "تأكيد كلمة المرور",
        selectRole: "اختر دورك",
        iAmStudent: "أنا طالب",
        iAmTeacher: "أنا معلم",
        alreadyHaveAccount: "لديك حساب بالفعل؟",
        
        // Student Lessons Page
        studentLessonsTitle: "دروسي",
        searchLessons: "البحث في الدروس...",
        allSubjects: "جميع المواد",
        noLessonsFound: "لا توجد دروس متاحة",
        noLessonsDescription: "لم يتم إضافة أي دروس بعد",
        lessonFiles: "الملفات",
        viewLesson: "عرض الدرس",
        downloadFiles: "تحميل الملفات",
        
        // Teacher Dashboard
        teacherDashboardTitle: "لوحة التحكم",
        totalLessons: "إجمالي الدروس",
        totalStudents: "إجمالي الطلاب",
        totalViews: "إجمالي المشاهدات",
        myLessons: "دروسي",
        addNewLesson: "إضافة درس جديد",
        lessonTitle: "عنوان الدرس",
        subject: "المادة",
        description: "الوصف",
        uploadFiles: "رفع الملفات",
        clickOrDrag: "اضغط أو اسحب الملفات هنا",
        supportedFormats: "PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX",
        publish: "نشر",
        cancel: "إلغاء",
        edit: "تعديل",
        delete: "حذف",
        
        // Common
        error: "خطأ",
        success: "نجاح",
        warning: "تحذير",
        info: "معلومة",
        yes: "نعم",
        no: "لا",
        save: "حفظ",
        close: "إغلاق",
        loading: "جاري التحميل...",
        pleaseWait: "يرجى الانتظار",
        now: "الآن",
        
        // Footer
        allRightsReserved: "جميع الحقوق محفوظة",
        year: "2024"
    },
    
    fr: {
        // Header
        platformName: "Plateforme de Cours Universitaires",
        lessons: "Cours",
        profile: "Profil",
        logout: "Déconnexion",
        login: "Connexion",
        register: "Créer un compte",
        
        // Profile Page
        profileTitle: "Profil",
        loading: "Chargement des données...",
        userId: "ID Utilisateur",
        registrationDate: "Date d'inscription",
        lastLogin: "Dernière connexion",
        role: "Rôle",
        student: "Étudiant",
        teacher: "Enseignant",
        admin: "Administrateur",
        goToLessons: "Aller aux cours",
        editProfile: "Modifier le profil",
        editFeatureComingSoon: "Fonction de modification en cours de développement",
        
        // Login Page
        loginTitle: "Connexion",
        loginDescription: "Entrez vos informations pour accéder à votre compte",
        email: "Email",
        password: "Mot de passe",
        rememberMe: "Se souvenir de moi",
        forgotPassword: "Mot de passe oublié?",
        noAccount: "Pas de compte?",
        createAccount: "Créer un nouveau compte",
        or: "ou",
        loginWithGoogle: "Se connecter avec Google",
        
        // Register Page
        registerTitle: "Créer un nouveau compte",
        registerDescription: "Créez votre compte pour commencer à apprendre",
        fullName: "Nom complet",
        confirmPassword: "Confirmer le mot de passe",
        selectRole: "Choisissez votre rôle",
        iAmStudent: "Je suis étudiant",
        iAmTeacher: "Je suis enseignant",
        alreadyHaveAccount: "Vous avez déjà un compte?",
        
        // Student Lessons Page
        studentLessonsTitle: "Mes Cours",
        searchLessons: "Rechercher des cours...",
        allSubjects: "Toutes les matières",
        noLessonsFound: "Aucun cours disponible",
        noLessonsDescription: "Aucun cours n'a encore été ajouté",
        lessonFiles: "Fichiers",
        viewLesson: "Voir le cours",
        downloadFiles: "Télécharger les fichiers",
        
        // Teacher Dashboard
        teacherDashboardTitle: "Tableau de bord",
        totalLessons: "Total des cours",
        totalStudents: "Total des étudiants",
        totalViews: "Total des vues",
        myLessons: "Mes cours",
        addNewLesson: "Ajouter un nouveau cours",
        lessonTitle: "Titre du cours",
        subject: "Matière",
        description: "Description",
        uploadFiles: "Télécharger des fichiers",
        clickOrDrag: "Cliquez ou glissez les fichiers ici",
        supportedFormats: "PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX",
        publish: "Publier",
        cancel: "Annuler",
        edit: "Modifier",
        delete: "Supprimer",
        
        // Common
        error: "Erreur",
        success: "Succès",
        warning: "Avertissement",
        info: "Information",
        yes: "Oui",
        no: "Non",
        save: "Enregistrer",
        close: "Fermer",
        loading: "Chargement...",
        pleaseWait: "Veuillez patienter",
        now: "Maintenant",
        
        // Footer
        allRightsReserved: "Tous droits réservés",
        year: "2024"
    },
    
    en: {
        // Header
        platformName: "University Lessons Platform",
        lessons: "Lessons",
        profile: "Profile",
        logout: "Logout",
        login: "Login",
        register: "Sign Up",
        
        // Profile Page
        profileTitle: "Profile",
        loading: "Loading data...",
        userId: "User ID",
        registrationDate: "Registration Date",
        lastLogin: "Last Login",
        role: "Role",
        student: "Student",
        teacher: "Teacher",
        admin: "Admin",
        goToLessons: "Go to Lessons",
        editProfile: "Edit Profile",
        editFeatureComingSoon: "Edit feature is under development",
        
        // Login Page
        loginTitle: "Login",
        loginDescription: "Enter your credentials to access your account",
        email: "Email",
        password: "Password",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password?",
        noAccount: "Don't have an account?",
        createAccount: "Create a new account",
        or: "or",
        loginWithGoogle: "Login with Google",
        
        // Register Page
        registerTitle: "Create New Account",
        registerDescription: "Create your account to start learning",
        fullName: "Full Name",
        confirmPassword: "Confirm Password",
        selectRole: "Select your role",
        iAmStudent: "I am a student",
        iAmTeacher: "I am a teacher",
        alreadyHaveAccount: "Already have an account?",
        
        // Student Lessons Page
        studentLessonsTitle: "My Lessons",
        searchLessons: "Search lessons...",
        allSubjects: "All subjects",
        noLessonsFound: "No lessons available",
        noLessonsDescription: "No lessons have been added yet",
        lessonFiles: "Files",
        viewLesson: "View Lesson",
        downloadFiles: "Download Files",
        
        // Teacher Dashboard
        teacherDashboardTitle: "Dashboard",
        totalLessons: "Total Lessons",
        totalStudents: "Total Students",
        totalViews: "Total Views",
        myLessons: "My Lessons",
        addNewLesson: "Add New Lesson",
        lessonTitle: "Lesson Title",
        subject: "Subject",
        description: "Description",
        uploadFiles: "Upload Files",
        clickOrDrag: "Click or drag files here",
        supportedFormats: "PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX",
        publish: "Publish",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        
        // Common
        error: "Error",
        success: "Success",
        warning: "Warning",
        info: "Info",
        yes: "Yes",
        no: "No",
        save: "Save",
        close: "Close",
        loading: "Loading...",
        pleaseWait: "Please wait",
        now: "Now",
        
        // Footer
        allRightsReserved: "All rights reserved",
        year: "2024"
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = translations;
}
