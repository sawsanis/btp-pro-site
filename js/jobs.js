// ========== JOBS.JS - FICHIER PRINCIPAL RESTRUCTURÉ ==========
// Coordinateur principal - Importe et orchestre tous les modules jobs

let isLoadingJobs = false;

// Importation des fonctions des modules (sera géré par les imports HTML)
// Les fonctions sont accessibles via window.* après chargement des scripts

async function loadJobsAnnounces() {
    if (isLoadingJobs) {
        console.log('⏳ Chargement déjà en cours...');
        return;
    }
    
    console.log('💼 Chargement des offres d\'emploi...');
    isLoadingJobs = true;
    
    try {
        const posts = await btpDB.get('job_posts');
        console.log('📊 Offres d\'emploi récupérées:', posts?.length || 0);
        
        const container = document.getElementById('jobs-container');
        
        if (!container) {
            console.warn('❌ Container jobs non trouvé');
            isLoadingJobs = false;
            return;
        }
        
        if (!posts || !Array.isArray(posts)) {
            console.error('❌ Données posts invalides:', posts);
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5 class="text-danger">Erreur de chargement des données</h5>
                    <button class="btn btn-warning btn-sm" onclick="loadJobsAnnounces()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
            isLoadingJobs = false;
            return;
        }
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucune offre d\'emploi disponible</h5>
                    <p class="text-muted">Soyez le premier à publier une offre !</p>
                    <button class="btn btn-warning" onclick="goToSection('publish')">
                        <i class="fas fa-plus me-2"></i>Publier la première offre
                    </button>
                </div>
            `;
            isLoadingJobs = false;
            return;
        }
        
        const approvedPosts = posts.filter(post => 
            post && (post.status === 'approuve' || post.status === 'approved' || !post.status)
        );
        
        console.log('✅ Offres d\'emploi approuvées:', approvedPosts.length);
        
        if (approvedPosts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucune offre d\'emploi disponible</h5>
                    <p class="text-muted">Toutes les offres sont en attente de modération</p>
                    <button class="btn btn-warning" onclick="goToSection('publish')">
                        <i class="fas fa-plus me-2"></i>Publier une offre
                    </button>
                </div>
            `;
            isLoadingJobs = false;
            return;
        }
        
        initializeJobsFilters(approvedPosts);
        
        if (typeof setupPagination === 'function') {
            setupPagination('jobs-container', approvedPosts, displayJobsPosts);
            console.log(`✅ ${approvedPosts.length} offres chargées avec pagination`);
        } else {
            displayJobsPosts(approvedPosts);
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement emplois:', error);
        const container = document.getElementById('jobs-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement des offres
                    </p>
                    <button class="btn btn-warning btn-sm" onclick="loadJobsAnnounces()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    } finally {
        isLoadingJobs = false;
        console.log('✅ Chargement des emplois terminé');
    }
}

function initializeJobsFilters(posts) {
    if (!posts || !Array.isArray(posts)) return;
    
    const contractTypes = [...new Set(posts.map(p => p?.contrat).filter(Boolean))];
    const cities = [...new Set(posts.map(p => p?.ville).filter(Boolean))];
    
    const contractFilter = document.getElementById('jobTypeFilter');
    if (contractFilter) {
        const firstChild = contractFilter.firstElementChild;
        contractFilter.innerHTML = '';
        if (firstChild) contractFilter.appendChild(firstChild);
        
        contractTypes.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract;
            option.textContent = getContractLabel(contract);
            contractFilter.appendChild(option);
        });
    }
    
    const cityFilter = document.getElementById('jobCityFilter');
    if (cityFilter) {
        const firstChild = cityFilter.firstElementChild;
        cityFilter.innerHTML = '';
        if (firstChild) cityFilter.appendChild(firstChild);
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }
}

async function filterJobs() {
    if (isLoadingJobs) return;
    
    console.log('🔍 Filtrage des offres d\'emploi...');
    
    try {
        const type = document.getElementById('jobTypeFilter')?.value;
        const city = document.getElementById('jobCityFilter')?.value;
        const experience = document.getElementById('jobExperienceFilter')?.value;
        const sort = document.getElementById('jobSort')?.value;
        
        const posts = await btpDB.get('job_posts');
        let filteredPosts = posts.filter(post => {
            if (!post) return false;
            if (type && post.contrat !== type) return false;
            if (city && post.ville !== city) return false;
            if (experience && !checkExperienceMatch(post.experience, experience)) return false;
            return post.status === 'approuve' || post.status === 'approved' || !post.status;
        });
        
        switch(sort) {
            case 'premium':
                filteredPosts.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
                break;
            default:
                filteredPosts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        
        if (typeof setupPagination === 'function') {
            setupPagination('jobs-container', filteredPosts, displayJobsPosts);
        } else {
            displayJobsPosts(filteredPosts);
        }
        
    } catch (error) {
        console.error('❌ Erreur filtrage emplois:', error);
        showAlert('❌ Erreur lors du filtrage', 'error');
    }
}

function clearJobsFilters() {
    document.getElementById('jobTypeFilter').value = '';
    document.getElementById('jobCityFilter').value = '';
    document.getElementById('jobExperienceFilter').value = '';
    document.getElementById('jobSort').value = 'newest';
    filterJobs();
}

// ========== FONCTIONS UTILITAIRES ==========
function getContractLabel(contractType) {
    const contracts = {
        'cdi': 'CDI',
        'cdd': 'CDD',
        'freelance': 'Freelance',
        'stage': 'Stage',
        'alternance': 'Alternance',
        'interim': 'Intérim'
    };
    return contracts[contractType] || contractType;
}

function checkExperienceMatch(postExperience, filterExperience) {
    if (!postExperience || !filterExperience) return true;
    
    const postExp = extractYearsFromExperience(postExperience);
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
}

function extractYearsFromExperience(experienceText) {
    if (!experienceText) return 0;
    const matches = experienceText.match(/\d+/g);
    return matches && matches.length > 0 ? parseInt(matches[0]) : 0;
}

// ========== COORDINATION DES MODULES ==========

// Ces fonctions délègent aux modules spécialisés
function displayJobsPosts(posts) {
    if (typeof JobsUI !== 'undefined' && JobsUI.displayJobsPosts) {
        JobsUI.displayJobsPosts(posts);
    } else {
        console.error('❌ Module JobsUI non chargé');
    }
}

function showJobApplicationForm(jobId) {
    if (typeof JobsForms !== 'undefined' && JobsForms.showJobApplicationForm) {
        JobsForms.showJobApplicationForm(jobId);
    } else {
        console.error('❌ Module JobsForms non chargé');
    }
}

function handlePublishJob(event) {
    if (typeof JobsForms !== 'undefined' && JobsForms.handlePublishJob) {
        JobsForms.handlePublishJob(event);
    } else {
        console.error('❌ Module JobsForms non chargé');
    }
}

function loadJobApplications() {
    if (typeof JobsApplications !== 'undefined' && JobsApplications.loadJobApplications) {
        JobsApplications.loadJobApplications();
    } else {
        console.error('❌ Module JobsApplications non chargé');
    }
}

function showJobRatingForm(jobId, employerId) {
    if (typeof JobsUI !== 'undefined' && JobsUI.showJobRatingForm) {
        JobsUI.showJobRatingForm(jobId, employerId);
    } else {
        console.error('❌ Module JobsUI non chargé');
    }
}

// ========== EXPORT DES FONCTIONS PRINCIPALES ==========
window.loadJobsAnnounces = loadJobsAnnounces;
window.filterJobs = filterJobs;
window.clearJobsFilters = clearJobsFilters;
window.handlePublishJob = handlePublishJob;
window.showJobApplicationForm = showJobApplicationForm;
window.loadJobApplications = loadJobApplications;
window.showJobRatingForm = showJobRatingForm;

// Export des fonctions utilitaires
window.getContractLabel = getContractLabel;

console.log('✅ jobs.js RESTRUCTURÉ - Coordinateur principal chargé');