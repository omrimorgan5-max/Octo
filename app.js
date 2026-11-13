/**
 * Octo Store & App Logic
 * Persists user progress, name, level, and XP in localStorage.
 */

const DEFAULT_STATE = {
    user: {
        name: "Alex Rivers",
        xp: 1420,
        streakDays: 5
    },
    modules: {
        "essay1": {
            id: "essay1",
            title: "Neural Networks & Architecture",
            completed: false,
            score: 0,
            maxScore: 5,
            readTimeMinutes: 8,
            link: "neural_networks_guide.html",
            quizLink: "quiz1.html"
        },
        "essay2": {
            id: "essay2",
            title: "Weights & Biases Explained",
            completed: false,
            score: 0,
            maxScore: 5,
            readTimeMinutes: 10,
            link: "quiz2.html",
            quizLink: "quiz2.html"
        },
        "essay3": {
            id: "essay3",
            title: "Why We Use LLM Models",
            completed: false,
            score: 0,
            maxScore: 5,
            readTimeMinutes: 12,
            link: "quiz3.html",
            quizLink: "quiz3.html"
        }
    }
};

class OctoApp {
    constructor() {
        this.STORAGE_KEY = 'octo_learning_portal_state';
        this.state = this.loadState();
        this.init();
    }

    loadState() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_STATE, ...parsed, user: { ...DEFAULT_STATE.user, ...parsed.user } };
            }
        } catch (e) {
            console.error("Failed to load state from localStorage:", e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    saveState() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error("Failed to save state to localStorage:", e);
        }
    }

    calculateLevel(xp) {
        return Math.floor(xp / 500) + 1;
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.runPreloader();
            this.bindNavigation();
            this.renderUserProfile();
            this.renderStats();
            this.bindQuizCards();
            this.bindFilters();
            this.bindSearch();
        });
    }

    runPreloader() {
        const preloader = document.getElementById('preloader');
        const progressBar = document.getElementById('progress-bar');
        if (!preloader || !progressBar) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 25) + 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    preloader.classList.add('opacity-0', 'pointer-events-none');
                    setTimeout(() => preloader.style.display = 'none', 400);
                }, 150);
            }
            progressBar.style.width = `${progress}%`;
        }, 60);
    }

    bindNavigation() {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if (btn && menu) {
            btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        }
    }

    renderUserProfile() {
        const nameEl = document.getElementById('profile-name');
        const tagEl = document.getElementById('profile-tag');
        const level = this.calculateLevel(this.state.user.xp);

        if (nameEl) nameEl.textContent = this.state.user.name;
        if (tagEl) tagEl.textContent = `Student • Level ${level}`;
    }

    renderStats() {
        const modulesArr = Object.values(this.state.modules);
        const totalModules = modulesArr.length;
        const completedModules = modulesArr.filter(m => m.completed).length;
        const totalReadTime = modulesArr.reduce((acc, m) => acc + m.readTimeMinutes, 0);
        const totalQuestions = modulesArr.reduce((acc, m) => acc + m.maxScore, 0);
        const percentDone = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        const progressText = document.getElementById('overall-progress-text');
        const readTimeText = document.getElementById('stat-read-time');
        const questionsText = document.getElementById('stat-questions');
        const modulesText = document.getElementById('stat-modules-count');

        if (progressText) progressText.textContent = `${percentDone}% Done`;
        if (readTimeText) readTimeText.textContent = `${totalReadTime} Minutes`;
        if (questionsText) questionsText.textContent = `${totalQuestions} Questions`;
        if (modulesText) modulesText.textContent = `${totalModules} Lessons`;
    }

    bindQuizCards() {
        const quizCards = document.querySelectorAll('.quiz-card');

        quizCards.forEach(card => {
            const moduleId = card.getAttribute('data-module-id');
            const toggleBtn = card.querySelector('.toggle-status-btn');

            if (!moduleId || !this.state.modules[moduleId]) return;

            this.updateCardUI(card, this.state.modules[moduleId].completed);

            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const currentStatus = this.state.modules[moduleId].completed;
                    const newStatus = !currentStatus;

                    this.state.modules[moduleId].completed = newStatus;
                    
                    if (newStatus) {
                        this.state.user.xp += 250;
                    } else {
                        this.state.user.xp = Math.max(0, this.state.user.xp - 250);
                    }

                    this.saveState();
                    this.updateCardUI(card, newStatus);
                    this.renderStats();
                    this.renderUserProfile();
                });
            }
        });
    }

    updateCardUI(card, isCompleted) {
        const statusBadge = card.querySelector('.status-badge');
        const toggleBtn = card.querySelector('.toggle-status-btn');

        card.setAttribute('data-status', isCompleted ? 'completed' : 'pending');

        if (isCompleted) {
            if (statusBadge) {
                statusBadge.className = 'status-badge px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent/15 border border-accent/40 text-accent-light flex items-center gap-1.5';
                statusBadge.innerHTML = '<i class="fa-solid fa-check text-[10px]"></i> Completed';
            }
            if (toggleBtn) {
                toggleBtn.className = 'toggle-status-btn p-2.5 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent-light border border-accent/40 transition';
                toggleBtn.innerHTML = '<i class="fa-solid fa-circle-check text-base"></i>';
            }
        } else {
            if (statusBadge) {
                statusBadge.className = 'status-badge px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5';
                statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Not Started';
            }
            if (toggleBtn) {
                toggleBtn.className = 'toggle-status-btn p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-accent-light border border-slate-700/60 transition';
                toggleBtn.innerHTML = '<i class="fa-regular fa-circle-check text-base"></i>';
            }
        }
    }

    bindFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const quizCards = document.querySelectorAll('.quiz-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('active', 'bg-primary', 'text-white');
                    b.classList.add('text-slate-400');
                });

                btn.classList.add('active', 'bg-primary', 'text-white');
                btn.classList.remove('text-slate-400');

                const filter = btn.getAttribute('data-filter');

                quizCards.forEach(card => {
                    const status = card.getAttribute('data-status');
                    if (filter === 'all' || status === filter) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    bindSearch() {
        const input = document.getElementById('quiz-search');
        const quizCards = document.querySelectorAll('.quiz-card');
        if (!input) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            quizCards.forEach(card => {
                const title = (card.getAttribute('data-title') || '').toLowerCase();
                const desc = card.querySelector('.quiz-desc')?.textContent.toLowerCase() || '';

                if (title.includes(query) || desc.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

window.octoApp = new OctoApp();