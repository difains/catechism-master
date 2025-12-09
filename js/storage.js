// LocalStorage 관리
const storage = {
    KEYS: {
        PROGRESS: 'catechism_progress',
        WRONG_ANSWERS: 'catechism_wrong',
        STARRED: 'catechism_starred',
        STATS: 'catechism_stats',
        MODE: 'catechism_mode',
        THEME: 'catechism_theme'
    },

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },

    getProgress() {
        return this.get(this.KEYS.PROGRESS) || {};
    },

    setProgress(questionId, level) {
        const progress = this.getProgress();
        progress[questionId] = level;
        this.set(this.KEYS.PROGRESS, progress);
    },

    getWrongAnswers() {
        return this.get(this.KEYS.WRONG_ANSWERS) || [];
    },

    addWrongAnswer(questionId) {
        const wrong = this.getWrongAnswers();
        if (!wrong.includes(questionId)) {
            wrong.push(questionId);
            this.set(this.KEYS.WRONG_ANSWERS, wrong);
        }
    },

    removeWrongAnswer(questionId) {
        const wrong = this.getWrongAnswers().filter(id => id !== questionId);
        this.set(this.KEYS.WRONG_ANSWERS, wrong);
    },

    getStarred() {
        return this.get(this.KEYS.STARRED) || [];
    },

    toggleStarred(questionId) {
        const starred = this.getStarred();
        const index = starred.indexOf(questionId);
        if (index > -1) {
            starred.splice(index, 1);
        } else {
            starred.push(questionId);
        }
        this.set(this.KEYS.STARRED, starred);
        return index === -1;
    },

    getStats() {
        return this.get(this.KEYS.STATS) || {
            totalAttempts: 0,
            correctAnswers: 0,
            streak: 0,
            bestStreak: 0
        };
    },

    updateStats(isCorrect) {
        const stats = this.getStats();
        stats.totalAttempts++;
        if (isCorrect) {
            stats.correctAnswers++;
            stats.streak++;
            if (stats.streak > stats.bestStreak) {
                stats.bestStreak = stats.streak;
            }
        } else {
            stats.streak = 0;
        }
        this.set(this.KEYS.STATS, stats);
        return stats;
    },

    getMode() {
        return this.get(this.KEYS.MODE) || 'elementary';
    },

    setMode(mode) {
        this.set(this.KEYS.MODE, mode);
    },

    getTheme() {
        return this.get(this.KEYS.THEME) || 'dark';
    },

    setTheme(theme) {
        this.set(this.KEYS.THEME, theme);
    },

    resetAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};
