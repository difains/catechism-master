// Main Application
const app = {
    currentPage: 'home',
    currentIndex: 0,
    currentMode: 'elementary',
    questions: [],
    currentBlankIndex: 0,
    matchingPairs: [],
    matchingSelected: null,
    matchingMatched: 0,
    matchingTimer: null,
    matchingTime: 0,

    init() {
        this.loadMode();
        this.loadTheme();
        this.filterQuestions();
        this.setupEventListeners();
        this.updateHomeStats();
    },

    loadMode() {
        this.currentMode = storage.getMode();
        document.getElementById('modeSelect').value = this.currentMode;
        this.filterQuestions();
    },

    loadTheme() {
        const theme = storage.getTheme();
        if (theme === 'light') {
            document.body.setAttribute('data-theme', 'light');
            document.getElementById('themeToggle').textContent = '☀️';
        }
    },

    filterQuestions() {
        if (this.currentMode === 'elementary') {
            this.questions = catechismData.questions.filter(q =>
                catechismData.elementary.includes(q.id)
            );
        } else {
            this.questions = [...catechismData.questions];
        }
        document.getElementById('totalQuestions').textContent = this.questions.length;
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.navigateTo(page);
            });
        });

        // Mode select
        document.getElementById('modeSelect').addEventListener('change', (e) => {
            this.currentMode = e.target.value;
            storage.setMode(this.currentMode);
            this.filterQuestions();
            this.updateHomeStats();
            this.currentIndex = 0;
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            const current = storage.getTheme();
            const newTheme = current === 'dark' ? 'light' : 'dark';
            storage.setTheme(newTheme);
            if (newTheme === 'light') {
                document.body.setAttribute('data-theme', 'light');
                document.getElementById('themeToggle').textContent = '☀️';
            } else {
                document.body.removeAttribute('data-theme');
                document.getElementById('themeToggle').textContent = '🌙';
            }
        });

        // Quiz input enter
        document.getElementById('quizInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });
    },

    navigateTo(page) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(page + 'Page').classList.add('active');
        this.currentPage = page;

        if (page === 'flashcard') this.loadFlashcard();
        if (page === 'quiz') this.loadQuiz();
        if (page === 'matching') this.startMatching();
        if (page === 'stats') this.loadStats();
    },

    updateHomeStats() {
        const progress = storage.getProgress();
        const stats = storage.getStats();

        const learned = Object.keys(progress).filter(id =>
            this.questions.some(q => q.id == id)
        ).length;
        const mastered = Object.values(progress).filter(level => level >= 3).length;

        document.getElementById('learnedCount').textContent = learned;
        document.getElementById('masteredCount').textContent = mastered;
        document.getElementById('streakCount').textContent = stats.streak;
    },

    // Flashcard
    loadFlashcard() {
        if (this.questions.length === 0) return;
        const q = this.questions[this.currentIndex];
        const card = document.getElementById('flashcard');
        card.classList.remove('flipped');

        card.querySelector('.card-number').textContent = `문 ${q.id}`;
        card.querySelector('.card-question').textContent = q.q;
        card.querySelector('.card-answer').textContent = q.a;
        card.querySelector('.card-verse').textContent = `📖 ${q.verse}`;

        const progress = ((this.currentIndex + 1) / this.questions.length) * 100;
        document.getElementById('flashcardProgress').style.width = `${progress}%`;

        const starred = storage.getStarred();
        const starBtn = document.querySelector('.star-btn');
        starBtn.classList.toggle('active', starred.includes(q.id));
    },

    flipCard() {
        document.getElementById('flashcard').classList.toggle('flipped');
    },

    prevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadFlashcard();
        }
    },

    nextCard() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            this.loadFlashcard();
        }
    },

    toggleStar() {
        const q = this.questions[this.currentIndex];
        const isStarred = storage.toggleStarred(q.id);
        document.querySelector('.star-btn').classList.toggle('active', isStarred);
    },

    // Quiz
    loadQuiz() {
        if (this.questions.length === 0) return;
        const q = this.questions[this.currentIndex];
        this.currentBlankIndex = 0;

        document.querySelector('.quiz-number').textContent = `문 ${q.id}`;
        document.getElementById('quizQuestion').textContent = q.q;

        // Create answer template with blanks
        let template = q.a;
        q.blanks.forEach((blank, i) => {
            if (i === 0) {
                template = template.replace(blank, `<span class="blank">[   ?   ]</span>`);
            } else {
                template = template.replace(blank, `<span class="blank-hidden">${blank}</span>`);
            }
        });
        document.getElementById('quizTemplate').innerHTML = template;
        document.getElementById('quizInput').value = '';
        document.getElementById('quizInput').focus();
        document.getElementById('quizFeedback').className = 'quiz-feedback';
        document.getElementById('quizFeedback').textContent = '';

        const progress = ((this.currentIndex + 1) / this.questions.length) * 100;
        document.getElementById('quizProgress').style.width = `${progress}%`;
    },

    checkAnswer() {
        const q = this.questions[this.currentIndex];
        const input = document.getElementById('quizInput').value.trim();
        const correctAnswer = q.blanks[this.currentBlankIndex];
        const feedback = document.getElementById('quizFeedback');

        const isCorrect = input === correctAnswer ||
            input.replace(/\s/g, '') === correctAnswer.replace(/\s/g, '');

        storage.updateStats(isCorrect);

        if (isCorrect) {
            feedback.className = 'quiz-feedback correct';
            feedback.textContent = '✅ 정답입니다!';
            storage.removeWrongAnswer(q.id);
            storage.setProgress(q.id, (storage.getProgress()[q.id] || 0) + 1);

            setTimeout(() => {
                if (this.currentIndex < this.questions.length - 1) {
                    this.currentIndex++;
                    this.loadQuiz();
                } else {
                    feedback.textContent = '🎉 모든 문제를 완료했습니다!';
                }
            }, 1000);
        } else {
            feedback.className = 'quiz-feedback wrong';
            feedback.textContent = `❌ 정답: ${correctAnswer}`;
            storage.addWrongAnswer(q.id);
        }

        this.updateHomeStats();
    },

    showHint() {
        const q = this.questions[this.currentIndex];
        const answer = q.blanks[this.currentBlankIndex];
        const hint = answer.substring(0, Math.ceil(answer.length / 2)) + '...';
        document.getElementById('quizFeedback').className = 'quiz-feedback';
        document.getElementById('quizFeedback').textContent = `💡 힌트: ${hint}`;
        document.getElementById('quizFeedback').style.display = 'block';
    },

    skipQuestion() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            this.loadQuiz();
        }
    },

    // Matching Game
    startMatching() {
        this.matchingMatched = 0;
        this.matchingSelected = null;
        this.matchingTime = 0;
        if (this.matchingTimer) clearInterval(this.matchingTimer);

        // Select 5 random questions
        const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);

        this.matchingPairs = [];
        selected.forEach(q => {
            this.matchingPairs.push({ id: q.id, type: 'q', text: q.q.substring(0, 30) + '...', matched: false });
            this.matchingPairs.push({ id: q.id, type: 'a', text: q.blanks[0], matched: false });
        });
        this.matchingPairs.sort(() => Math.random() - 0.5);

        this.renderMatchingGrid();
        this.startMatchingTimer();
    },

    renderMatchingGrid() {
        const grid = document.getElementById('matchingGrid');
        grid.innerHTML = '';

        this.matchingPairs.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'match-item' + (item.matched ? ' matched' : '');
            div.textContent = item.type === 'q' ? `문${item.id}: ${item.text}` : item.text;
            div.onclick = () => this.selectMatchItem(index);
            grid.appendChild(div);
        });

        document.getElementById('matchScore').textContent = `매칭: ${this.matchingMatched}/5`;
    },

    selectMatchItem(index) {
        const item = this.matchingPairs[index];
        if (item.matched) return;

        const items = document.querySelectorAll('.match-item');

        if (this.matchingSelected === null) {
            this.matchingSelected = index;
            items[index].classList.add('selected');
        } else if (this.matchingSelected === index) {
            items[index].classList.remove('selected');
            this.matchingSelected = null;
        } else {
            const first = this.matchingPairs[this.matchingSelected];
            const second = item;

            if (first.id === second.id && first.type !== second.type) {
                first.matched = true;
                second.matched = true;
                this.matchingMatched++;

                if (this.matchingMatched === 5) {
                    clearInterval(this.matchingTimer);
                    setTimeout(() => {
                        alert(`🎉 완료! 소요 시간: ${this.matchingTime}초`);
                    }, 300);
                }
            }

            items[this.matchingSelected].classList.remove('selected');
            this.matchingSelected = null;
            this.renderMatchingGrid();
        }
    },

    startMatchingTimer() {
        this.matchingTimer = setInterval(() => {
            this.matchingTime++;
            const mins = Math.floor(this.matchingTime / 60).toString().padStart(2, '0');
            const secs = (this.matchingTime % 60).toString().padStart(2, '0');
            document.getElementById('matchTimer').textContent = `⏱️ ${mins}:${secs}`;
        }, 1000);
    },

    restartMatching() {
        this.startMatching();
    },

    // Stats
    loadStats() {
        const stats = storage.getStats();
        document.getElementById('totalAttempts').textContent = `${stats.totalAttempts}회`;
        const accuracy = stats.totalAttempts > 0
            ? Math.round((stats.correctAnswers / stats.totalAttempts) * 100)
            : 0;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('bestStreak').textContent = stats.bestStreak;
    },

    resetProgress() {
        if (confirm('모든 진도를 초기화하시겠습니까?')) {
            storage.resetAll();
            this.updateHomeStats();
            this.loadStats();
            alert('초기화되었습니다.');
        }
    },

    // Quick actions
    startQuickLearn() {
        this.currentIndex = 0;
        this.navigateTo('flashcard');
    },

    startReview() {
        this.currentIndex = 0;
        this.navigateTo('quiz');
    },

    showWrongAnswers() {
        const wrong = storage.getWrongAnswers();
        if (wrong.length === 0) {
            alert('오답이 없습니다! 🎉');
            return;
        }
        this.questions = catechismData.questions.filter(q => wrong.includes(q.id));
        this.currentIndex = 0;
        this.navigateTo('quiz');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());
