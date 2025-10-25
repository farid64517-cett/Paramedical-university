/**
 * مدير البيانات - Data Manager
 * يتعامل مع جميع عمليات CRUD للبيانات
 */

class DataManager {
    constructor() {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // ==================== عمليات المستخدمين ====================

    /**
     * الحصول على معلومات مستخدم
     */
    async getUser(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على قائمة المعلمين
     */
    async getTeachers() {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('role', 'teacher')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching teachers:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تحديث معلومات المستخدم
     */
    async updateUser(userId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== عمليات الدروس ====================

    /**
     * إنشاء درس جديد
     */
    async createLesson(lessonData) {
        try {
            const { data, error } = await this.supabase
                .from('lessons')
                .insert(lessonData)
                .select()
                .single();

            if (error) throw error;
            
            // تسجيل النشاط
            await this.logActivity('إنشاء درس جديد', 'lesson', data.id);
            
            return { success: true, data };
        } catch (error) {
            console.error('Error creating lesson:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على درس واحد
     */
    async getLesson(lessonId) {
        try {
            const { data, error } = await this.supabase
                .from('lessons')
                .select(`
                    *,
                    teacher:teacher_id (
                        id,
                        full_name,
                        profile_image,
                        department
                    )
                `)
                .eq('id', lessonId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching lesson:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على قائمة الدروس
     */
    async getLessons(filters = {}) {
        try {
            let query = this.supabase
                .from('lessons')
                .select(`
                    *,
                    teacher:teacher_id (
                        id,
                        full_name,
                        profile_image
                    ),
                    enrollments_count:enrollments(count)
                `);

            // تطبيق الفلاتر
            if (filters.teacherId) {
                query = query.eq('teacher_id', filters.teacherId);
            }
            if (filters.subject) {
                query = query.eq('subject', filters.subject);
            }
            if (filters.yearLevel) {
                query = query.eq('year_level', filters.yearLevel);
            }
            if (filters.isPublished !== undefined) {
                query = query.eq('is_published', filters.isPublished);
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            // الترتيب
            const orderBy = filters.orderBy || 'created_at';
            const ascending = filters.ascending || false;
            query = query.order(orderBy, { ascending });

            // التصفح
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
            }

            const { data, error, count } = await query;

            if (error) throw error;
            return { success: true, data, count };
        } catch (error) {
            console.error('Error fetching lessons:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تحديث درس
     */
    async updateLesson(lessonId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('lessons')
                .update(updates)
                .eq('id', lessonId)
                .select()
                .single();

            if (error) throw error;
            
            // تسجيل النشاط
            await this.logActivity('تحديث درس', 'lesson', lessonId);
            
            return { success: true, data };
        } catch (error) {
            console.error('Error updating lesson:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * حذف درس
     */
    async deleteLesson(lessonId) {
        try {
            const { error } = await this.supabase
                .from('lessons')
                .delete()
                .eq('id', lessonId);

            if (error) throw error;
            
            // تسجيل النشاط
            await this.logActivity('حذف درس', 'lesson', lessonId);
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting lesson:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * نشر/إلغاء نشر درس
     */
    async toggleLessonPublish(lessonId, isPublished) {
        try {
            const { data, error } = await this.supabase
                .from('lessons')
                .update({ is_published: isPublished })
                .eq('id', lessonId)
                .select()
                .single();

            if (error) throw error;
            
            const action = isPublished ? 'نشر درس' : 'إلغاء نشر درس';
            await this.logActivity(action, 'lesson', lessonId);
            
            return { success: true, data };
        } catch (error) {
            console.error('Error toggling lesson publish:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== عمليات التسجيل في الدروس ====================

    /**
     * التسجيل في درس
     */
    async enrollInLesson(lessonId, studentId) {
        try {
            const { data, error } = await this.supabase
                .from('enrollments')
                .insert({
                    student_id: studentId,
                    lesson_id: lessonId
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    throw new Error('أنت مسجل بالفعل في هذا الدرس');
                }
                throw error;
            }
            
            // تسجيل النشاط
            await this.logActivity('التسجيل في درس', 'enrollment', data.id, { lesson_id: lessonId });
            
            // إنشاء إشعار للمعلم
            await this.createNotificationForTeacher(lessonId, studentId);
            
            return { success: true, data };
        } catch (error) {
            console.error('Error enrolling in lesson:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * إلغاء التسجيل من درس
     */
    async unenrollFromLesson(lessonId, studentId) {
        try {
            const { error } = await this.supabase
                .from('enrollments')
                .delete()
                .eq('lesson_id', lessonId)
                .eq('student_id', studentId);

            if (error) throw error;
            
            // تسجيل النشاط
            await this.logActivity('إلغاء التسجيل من درس', 'lesson', lessonId);
            
            return { success: true };
        } catch (error) {
            console.error('Error unenrolling from lesson:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على التسجيلات للطالب
     */
    async getStudentEnrollments(studentId) {
        try {
            const { data, error } = await this.supabase
                .from('enrollments')
                .select(`
                    *,
                    lesson:lesson_id (
                        *,
                        teacher:teacher_id (
                            id,
                            full_name,
                            profile_image
                        )
                    )
                `)
                .eq('student_id', studentId)
                .order('enrolled_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching student enrollments:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على الطلاب المسجلين في درس
     */
    async getLessonEnrollments(lessonId) {
        try {
            const { data, error } = await this.supabase
                .from('enrollments')
                .select(`
                    *,
                    student:student_id (
                        id,
                        full_name,
                        email,
                        profile_image,
                        university,
                        department,
                        year_of_study
                    )
                `)
                .eq('lesson_id', lessonId)
                .order('enrolled_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching lesson enrollments:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تحديث تقدم الطالب
     */
    async updateProgress(enrollmentId, progress) {
        try {
            const updates = {
                progress_percentage: progress,
                last_accessed: new Date().toISOString()
            };

            if (progress === 100) {
                updates.is_completed = true;
                updates.completed_at = new Date().toISOString();
            }

            const { data, error } = await this.supabase
                .from('enrollments')
                .update(updates)
                .eq('id', enrollmentId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating progress:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== عمليات المواد التعليمية ====================

    /**
     * إضافة مادة تعليمية
     */
    async addMaterial(materialData) {
        try {
            const { data, error } = await this.supabase
                .from('materials')
                .insert(materialData)
                .select()
                .single();

            if (error) throw error;
            
            // تسجيل النشاط
            await this.logActivity('إضافة مادة تعليمية', 'material', data.id);
            
            return { success: true, data };
        } catch (error) {
            console.error('Error adding material:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على المواد التعليمية لدرس
     */
    async getLessonMaterials(lessonId) {
        try {
            const { data, error } = await this.supabase
                .from('materials')
                .select('*')
                .eq('lesson_id', lessonId)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching materials:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * حذف مادة تعليمية
     */
    async deleteMaterial(materialId) {
        try {
            const { error } = await this.supabase
                .from('materials')
                .delete()
                .eq('id', materialId);

            if (error) throw error;
            
            // تسجيل النشاط
            await this.logActivity('حذف مادة تعليمية', 'material', materialId);
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting material:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== عمليات التعليقات ====================

    /**
     * إضافة تعليق
     */
    async addComment(commentData) {
        try {
            const { data, error } = await this.supabase
                .from('comments')
                .insert(commentData)
                .select(`
                    *,
                    user:user_id (
                        id,
                        full_name,
                        profile_image
                    )
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error adding comment:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على تعليقات درس
     */
    async getLessonComments(lessonId) {
        try {
            const { data, error } = await this.supabase
                .from('comments')
                .select(`
                    *,
                    user:user_id (
                        id,
                        full_name,
                        profile_image,
                        role
                    ),
                    replies:comments!parent_comment_id (
                        *,
                        user:user_id (
                            id,
                            full_name,
                            profile_image,
                            role
                        )
                    )
                `)
                .eq('lesson_id', lessonId)
                .is('parent_comment_id', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching comments:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تحديث تعليق
     */
    async updateComment(commentId, content) {
        try {
            const { data, error } = await this.supabase
                .from('comments')
                .update({ 
                    content: content,
                    is_edited: true
                })
                .eq('id', commentId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating comment:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * حذف تعليق
     */
    async deleteComment(commentId) {
        try {
            const { error } = await this.supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting comment:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== عمليات الإشعارات ====================

    /**
     * إنشاء إشعار
     */
    async createNotification(notificationData) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .insert(notificationData)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على إشعارات المستخدم
     */
    async getUserNotifications(userId, unreadOnly = false) {
        try {
            let query = this.supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId);

            if (unreadOnly) {
                query = query.eq('is_read', false);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * وضع علامة مقروء على إشعار
     */
    async markNotificationAsRead(notificationId) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * وضع علامة مقروء على جميع الإشعارات
     */
    async markAllNotificationsAsRead(userId) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== عمليات الإحصائيات ====================

    /**
     * الحصول على إحصائيات المعلم
     */
    async getTeacherStats(teacherId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_teacher_stats', { teacher_uuid: teacherId });

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error fetching teacher stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على إحصائيات الطالب
     */
    async getStudentStats(studentId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_student_stats', { student_uuid: studentId });

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error fetching student stats:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== دوال مساعدة ====================

    /**
     * تسجيل النشاط
     */
    async logActivity(action, entityType = null, entityId = null, metadata = {}) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            await this.supabase
                .from('activity_log')
                .insert({
                    user_id: user.id,
                    action: action,
                    entity_type: entityType,
                    entity_id: entityId,
                    metadata: metadata
                });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    /**
     * إنشاء إشعار للمعلم عند تسجيل طالب جديد
     */
    async createNotificationForTeacher(lessonId, studentId) {
        try {
            // الحصول على معلومات الدرس والطالب
            const { data: lesson } = await this.getLesson(lessonId);
            const { data: student } = await this.getUser(studentId);

            if (lesson && student) {
                await this.createNotification({
                    user_id: lesson.teacher_id,
                    title: 'طالب جديد',
                    message: `قام ${student.full_name} بالتسجيل في درس "${lesson.title}"`,
                    type: 'info',
                    action_url: `/teacher-dashboard.html#lesson/${lessonId}`
                });
            }
        } catch (error) {
            console.error('Error creating notification for teacher:', error);
        }
    }

    /**
     * رفع ملف إلى Supabase Storage
     */
    async uploadFile(file, bucket = 'materials', path = '') {
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = path ? `${path}/${fileName}` : fileName;

            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;

            // الحصول على رابط الملف
            const { data: { publicUrl } } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return { 
                success: true, 
                data: {
                    path: data.path,
                    url: publicUrl
                }
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * حذف ملف من Supabase Storage
     */
    async deleteFile(filePath, bucket = 'materials') {
        try {
            const { error } = await this.supabase.storage
                .from(bucket)
                .remove([filePath]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting file:', error);
            return { success: false, error: error.message };
        }
    }
}

// إنشاء مثيل واحد من مدير البيانات
const dataManager = new DataManager();

// تصدير للاستخدام في ملفات أخرى
window.dataManager = dataManager;
