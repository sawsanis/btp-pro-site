// ========== JOBS-DATA.JS - GESTION DES DONNÉES EMPLOI ==========

const JobsData = {
    // ========== OPÉRATIONS SUR LES OFFRES D'EMPLOI ==========
    
    async getAllJobPosts() {
        try {
            const posts = await btpDB.get('job_posts');
            return posts || [];
        } catch (error) {
            console.error('❌ Erreur récupération offres:', error);
            return [];
        }
    },

    async getApprovedJobPosts() {
        try {
            const posts = await this.getAllJobPosts();
            return posts.filter(post => 
                post && (post.status === 'approuve' || post.status === 'approved' || !post.status)
            );
        } catch (error) {
            console.error('❌ Erreur récupération offres approuvées:', error);
            return [];
        }
    },

    async getJobPostById(jobId) {
        try {
            const posts = await this.getAllJobPosts();
            return posts.find(post => post.id === jobId);
        } catch (error) {
            console.error('❌ Erreur récupération offre:', error);
            return null;
        }
    },

    async createJobPost(jobData) {
        try {
            const newJob = await btpDB.post('job_posts', jobData);
            console.log('✅ Offre créée:', newJob.id);
            return newJob;
        } catch (error) {
            console.error('❌ Erreur création offre:', error);
            throw error;
        }
    },

    async updateJobPost(jobId, updates) {
        try {
            const updatedJob = await btpDB.put('job_posts', jobId, updates);
            console.log('✅ Offre mise à jour:', jobId);
            return updatedJob;
        } catch (error) {
            console.error('❌ Erreur mise à jour offre:', error);
            throw error;
        }
    },

    async deleteJobPost(jobId) {
        try {
            await btpDB.delete('job_posts', jobId);
            console.log('✅ Offre supprimée:', jobId);
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression offre:', error);
            throw error;
        }
    },

    // ========== OPÉRATIONS SUR LES CANDIDATURES ==========
    
    async getAllApplications() {
        try {
            const applications = await btpDB.get('job_applications');
            return applications || [];
        } catch (error) {
            console.error('❌ Erreur récupération candidatures:', error);
            return [];
        }
    },

    async getApplicationsForJob(jobId) {
        try {
            const applications = await this.getAllApplications();
            return applications.filter(app => app.jobId === jobId);
        } catch (error) {
            console.error('❌ Erreur récupération candidatures offre:', error);
            return [];
        }
    },

    async getUserApplications(userId) {
        try {
            const applications = await this.getAllApplications();
            return applications.filter(app => app.candidateId === userId);
        } catch (error) {
            console.error('❌ Erreur récupération candidatures utilisateur:', error);
            return [];
        }
    },

    async createApplication(applicationData) {
        try {
            const newApplication = await btpDB.post('job_applications', applicationData);
            console.log('✅ Candidature créée:', newApplication.id);
            return newApplication;
        } catch (error) {
            console.error('❌ Erreur création candidature:', error);
            throw error;
        }
    },

    async updateApplication(applicationId, updates) {
        try {
            const updatedApplication = await btpDB.put('job_applications', applicationId, updates);
            console.log('✅ Candidature mise à jour:', applicationId);
            return updatedApplication;
        } catch (error) {
            console.error('❌ Erreur mise à jour candidature:', error);
            throw error;
        }
    },

    async getApplicationCountForJob(jobId) {
        try {
            const applications = await this.getApplicationsForJob(jobId);
            return applications.length;
        } catch (error) {
            console.error('❌ Erreur comptage candidatures:', error);
            return 0;
        }
    },

    // ========== OPÉRATIONS SUR LES NOTATIONS ==========
    
    async getAllRatings() {
        try {
            const ratings = await btpDB.get('job_ratings');
            return ratings || [];
        } catch (error) {
            console.error('❌ Erreur récupération notations:', error);
            return [];
        }
    },

    async getRatingsForJob(jobId) {
        try {
            const ratings = await this.getAllRatings();
            return ratings.filter(rating => rating.jobId === jobId && rating.status === 'approuve');
        } catch (error) {
            console.error('❌ Erreur récupération notations offre:', error);
            return [];
        }
    },

    async createRating(ratingData) {
        try {
            const newRating = await btpDB.post('job_ratings', ratingData);
            console.log('✅ Notation créée:', newRating.id);
            return newRating;
        } catch (error) {
            console.error('❌ Erreur création notation:', error);
            throw error;
        }
    },

    async updateEmployerRating(employerId) {
        try {
            const ratings = await this.getAllRatings();
            const employerRatings = ratings.filter(r => 
                r.employerId === employerId && r.status === 'approuve'
            );

            if (employerRatings.length > 0) {
                const totalRating = employerRatings.reduce((sum, rating) => sum + rating.rating, 0);
                const averageRating = totalRating / employerRatings.length;

                const employers = await btpDB.get('employer_profiles');
                let employerProfile = employers.find(emp => emp.userId === employerId);

                if (!employerProfile) {
                    employerProfile = {
                        userId: employerId,
                        rating: averageRating,
                        ratingCount: employerRatings.length,
                        createdAt: new Date().toISOString()
                    };
                    await btpDB.post('employer_profiles', employerProfile);
                } else {
                    employerProfile.rating = averageRating;
                    employerProfile.ratingCount = employerRatings.length;
                    employerProfile.updatedAt = new Date().toISOString();
                    await btpDB.put('employer_profiles', employerProfile.id, employerProfile);
                }
                
                return averageRating;
            }
            return 0;
        } catch (error) {
            console.error('❌ Erreur mise à jour note employeur:', error);
            throw error;
        }
    },

    // ========== OPÉRATIONS SUR LES NOTIFICATIONS ==========
    
    async createNotification(notificationData) {
        try {
            const newNotification = await btpDB.post('notifications', notificationData);
            console.log('✅ Notification créée:', newNotification.id);
            return newNotification;
        } catch (error) {
            console.error('❌ Erreur création notification:', error);
            throw error;
        }
    },

    async getUnreadNotifications(userId) {
        try {
            const notifications = await btpDB.get('notifications');
            return notifications.filter(notif => 
                notif.recipientId === userId && !notif.isRead
            );
        } catch (error) {
            console.error('❌ Erreur récupération notifications:', error);
            return [];
        }
    },

    // ========== STATISTIQUES ET ANALYTIQUES ==========
    
    async getJobsStats() {
        try {
            const [posts, applications, ratings] = await Promise.all([
                this.getAllJobPosts(),
                this.getAllApplications(),
                this.getAllRatings()
            ]);

            const approvedPosts = posts.filter(post => 
                post.status === 'approuve' || post.status === 'approved' || !post.status
            );

            return {
                totalJobs: posts.length,
                approvedJobs: approvedPosts.length,
                pendingJobs: posts.filter(p => p.status === 'en_attente').length,
                totalApplications: applications.length,
                totalRatings: ratings.length,
                averageRating: ratings.length > 0 ? 
                    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0
            };
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {};
        }
    },

    // ========== FONCTIONS DE VALIDATION ==========
    
    async checkIfUserAppliedToJob(jobId, userId) {
        try {
            const applications = await this.getApplicationsForJob(jobId);
            return applications.some(app => app.candidateId === userId);
        } catch (error) {
            console.error('❌ Erreur vérification candidature:', error);
            return false;
        }
    },

    async checkIfUserIsEmployer(userId) {
        try {
            const posts = await this.getAllJobPosts();
            return posts.some(post => post.userId === userId);
        } catch (error) {
            console.error('❌ Erreur vérification employeur:', error);
            return false;
        }
    },

    // ========== FONCTIONS DE FILTRAGE ==========
    
    async filterJobPosts(filters = {}) {
        try {
            const posts = await this.getApprovedJobPosts();
            
            return posts.filter(post => {
                if (filters.type && post.contrat !== filters.type) return false;
                if (filters.city && post.ville !== filters.city) return false;
                if (filters.experience && !this.checkExperienceMatch(post.experience, filters.experience)) return false;
                return true;
            });
        } catch (error) {
            console.error('❌ Erreur filtrage offres:', error);
            return [];
        }
    },

    checkExperienceMatch(postExperience, filterExperience) {
        if (!postExperience || !filterExperience) return true;
        
        const postExp = this.extractYearsFromExperience(postExperience);
        const [minFilter, maxFilter] = filterExperience.split('-').map(exp => {
            const value = parseInt(exp.replace('+', ''));
            return isNaN(value) ? 0 : value;
        });
        
        if (filterExperience.endsWith('+')) {
            return postExp >= minFilter;
        } else if (maxFilter) {
            return postExp >= minFilter && postExp <= maxFilter;
        }
        
        return true;
    },

    extractYearsFromExperience(experienceText) {
        if (!experienceText) return 0;
        const matches = experienceText.match(/\d+/g);
        return matches && matches.length > 0 ? parseInt(matches[0]) : 0;
    }
};

// Export global
window.JobsData = JobsData;
console.log('✅ jobs-data.js CHARGÉ - Module de données emploi initialisé');