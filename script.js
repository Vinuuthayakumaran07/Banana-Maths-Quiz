document.addEventListener('DOMContentLoaded', function() {
    // ==================== AUTHENTICATION SYSTEM ====================
    const authContainer = document.getElementById('auth-container');
    const mainContainer = document.querySelector('.container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');
    const playerNameDisplay = document.getElementById('player-name');
    
    // Form toggle buttons
    document.getElementById('show-signup').addEventListener('click', () => toggleForms(loginForm, signupForm));
    document.getElementById('show-login').addEventListener('click', () => toggleForms(signupForm, loginForm));
    document.getElementById('show-forgot').addEventListener('click', () => toggleForms(loginForm, forgotForm));
    document.getElementById('show-login-from-forgot').addEventListener('click', () => toggleForms(forgotForm, loginForm));
    
    function toggleForms(hideForm, showForm) {
        hideForm.style.display = 'none';
        showForm.style.display = 'block';
    }
    
    // User storage functions
    function getUsers() {
        return JSON.parse(localStorage.getItem('bananaUsers')) || {};
    }
    
    function saveUsers(users) {
        localStorage.setItem('bananaUsers', JSON.stringify(users));
    }
    
    // Login function
    document.getElementById('login-btn').addEventListener('click', () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const users = getUsers();
        
        if (!validateAuthInput(username, password)) {
            alert('Please enter both username and password');
            return;
        }
        
        if (users[username] && users[username].password === password) {
            handleSuccessfulLogin(username);
        } else {
            alert('Invalid username or password');
        }
    });
    
    // Signup function
    document.getElementById('signup-btn').addEventListener('click', () => {
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const confirm = document.getElementById('signup-confirm').value.trim();
        const users = getUsers();
        
        if (!validateSignup(username, password, confirm, users)) return;
        
        users[username] = { password, highScore: 0 };
        saveUsers(users);
        alert('Account created successfully! Please login.');
        toggleForms(signupForm, loginForm);
        clearSignupForm();
    });
    
    function validateSignup(username, password, confirm, users) {
        if (!username || !password || !confirm) {
            alert('Please fill all fields');
            return false;
        }
        
        if (password !== confirm) {
            alert('Passwords do not match');
            return false;
        }
        
        if (username.length < 4) {
            alert('Username must be at least 4 characters');
            return false;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return false;
        }
        
        if (users[username]) {
            alert('Username already exists');
            return false;
        }
        
        return true;
    }
    
    function clearSignupForm() {
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-confirm').value = '';
    }
    
    // Password reset function
    document.getElementById('reset-btn').addEventListener('click', () => {
        const username = document.getElementById('forgot-username').value.trim();
        const users = getUsers();
        
        if (!username) {
            alert('Please enter your username');
            return;
        }
        
        if (!users[username]) {
            alert('Username not found');
            return;
        }
        
        const newPassword = prompt('Enter new password (min 6 characters):');
        if (newPassword && newPassword.length >= 6) {
            users[username].password = newPassword;
            saveUsers(users);
            alert('Password reset successfully!');
            toggleForms(forgotForm, loginForm);
            document.getElementById('forgot-username').value = '';
        } else {
            alert('Password must be at least 6 characters');
        }
    });
    
    // ==================== GAME SYSTEM ====================
    // Game elements
    const questionImage = document.getElementById('question-image');
    const questionText = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    const hintContainer = document.getElementById('hint-container');
    
    // Difficulty buttons
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');
    
    // Containers
    const difficultySelector = document.querySelector('.difficulty-selector');
    const gameArea = document.querySelector('.game-area');
    const quizContainer = document.querySelector('.quiz-container');
    const resultContainer = document.querySelector('.result-container');
    const resultMessage = document.getElementById('result-message');
    const gameOverContainer = document.querySelector('.game-over');
    
    // Stats elements
    const scoreElement = document.getElementById('score');
    const timeElement = document.getElementById('time');
    const streakElement = document.getElementById('streak');
    const difficultyDisplay = document.getElementById('current-difficulty');
    const finalScoreElement = document.getElementById('final-score');
    const greetingMessage = document.querySelector('.greeting-message');
    
    // Game variables
    let score = 0;
    let streak = 0;
    let timeLeft = 40;
    let timer;
    let currentQuestion = {};
    let correctAnswer;
    let currentDifficulty = 'easy';
    let hintInterval;
    
    // Initialize the game
    function initGame(difficulty) {
        resetGameState();
        currentDifficulty = difficulty;
        
        // Set time based on difficulty
        timeLeft = difficulty === 'easy' ? 40 : difficulty === 'medium' ? 20 : 10;
        
        difficultyDisplay.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        updateStatsDisplay();
        
        difficultySelector.classList.add('hidden');
        gameArea.classList.remove('hidden');
        quizContainer.classList.remove('hidden');
        
        startTimer();
        fetchQuestion();
    }
    
    function resetGameState() {
        score = 0;
        streak = 0;
        clearInterval(timer);
        clearInterval(hintInterval);
    }
    
    function updateStatsDisplay() {
        scoreElement.textContent = score;
        streakElement.textContent = streak;
        timeElement.textContent = timeLeft;
    }
    
    // Event listeners for difficulty buttons
    easyBtn.addEventListener('click', () => initGame('easy'));
    mediumBtn.addEventListener('click', () => initGame('medium'));
    hardBtn.addEventListener('click', () => initGame('hard'));
    
    // Game event listeners
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', showDifficultySelector);
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkAnswer();
    });
    
    function showDifficultySelector() {
        difficultySelector.classList.remove('hidden');
        gameOverContainer.classList.add('hidden');
    }
    
    function startTimer() {
        clearInterval(timer);
        timer = setInterval(() => {
            timeLeft--;
            timeElement.textContent = timeLeft;
            
            if (timeLeft <= 0) endGame();
        }, 1000);
    }
    
    async function fetchQuestion() {
        try {
            clearHints();
            
            const response = await fetch('https://marcconrad.com/uob/banana/api.php');
            const data = await response.json();
            
            currentQuestion = data;
            correctAnswer = parseInt(data.solution);
            
            questionImage.innerHTML = `<img src="${data.question}" alt="Maths question">`;
            questionText.textContent = "Solve the problem to reveal the banana!";
            
            resetQuestionUI();
            
            if (currentDifficulty === 'hard') provideHint();
        } catch (error) {
            console.error('Error fetching question:', error);
            useFallbackQuestion();
        }
    }
    
    function useFallbackQuestion() {
        currentQuestion = {
            question: "https://marcconrad.com/uob/banana/example1.png",
            solution: "7"
        };
        correctAnswer = 7;
        questionImage.innerHTML = '<img src="https://marcconrad.com/uob/banana/example1.png" alt="Maths question">';
        questionText.textContent = "Solve the problem to reveal the banana!";
        
        if (currentDifficulty === 'hard') provideHint();
    }
    
    function resetQuestionUI() {
        answerInput.value = '';
        answerInput.focus();
        resultContainer.classList.add('hidden');
        quizContainer.classList.remove('hidden');
    }
    
    function clearHints() {
        hintContainer.classList.add('hidden');
        clearInterval(hintInterval);
    }
    
    function provideHint() {
        clearInterval(hintInterval);
        
        const isEven = correctAnswer % 2 === 0;
        hintContainer.textContent = `Hint: The answer is an ${isEven ? 'even' : 'odd'} number`;
        hintContainer.classList.remove('hidden');
        
        hintInterval = setTimeout(() => {
            const range = Math.max(1, Math.floor(correctAnswer * 0.3));
            hintContainer.textContent = `Hint: Between ${Math.max(0, correctAnswer - range)} and ${correctAnswer + range}`;
        }, 3000);
    }
    
    function checkAnswer() {
        const userAnswer = parseInt(answerInput.value);
        
        if (isNaN(userAnswer)) {
            alert('Please enter a valid number');
            return;
        }
        
        const points = calculatePoints();
        
        if (userAnswer === correctAnswer) {
            handleCorrectAnswer(points);
        } else {
            handleIncorrectAnswer();
        }
        
        updateStatsDisplay();
        showResult();
    }
    
    function calculatePoints() {
        switch(currentDifficulty) {
            case 'easy': return 10 + (streak * 2);
            case 'medium': return 20 + (streak * 3);
            case 'hard': return 30 + (streak * 5);
            default: return 10;
        }
    }
    
    function handleCorrectAnswer(points) {
        score += points;
        streak++;
        resultMessage.textContent = `🍌 Correct! +${points} points 🍌`;
        resultMessage.className = 'correct';
    }
    
    function handleIncorrectAnswer() {
        streak = 0;
        resultMessage.textContent = `Wrong! The correct answer was ${correctAnswer}.`;
        resultMessage.className = 'incorrect';
    }
    
    function showResult() {
        quizContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        clearInterval(hintInterval);
    }
    
    function nextQuestion() {
        fetchQuestion();
    }
    
    function endGame() {
        clearGameIntervals();
        hideGameUI();
        showFinalResults();
        updateHighScore();
    }
    
    function clearGameIntervals() {
        clearInterval(timer);
        clearInterval(hintInterval);
    }
    
    function hideGameUI() {
        quizContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
    }
    
    function showFinalResults() {
        gameOverContainer.classList.remove('hidden');
        finalScoreElement.textContent = score;
        greetingMessage.textContent = getGreetingMessage(score);
    }
    
    function updateHighScore() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;
        
        const users = getUsers();
        if (!users[currentUser].highScore || score > users[currentUser].highScore) {
            users[currentUser].highScore = score;
            saveUsers(users);
        }
    }
    
    function getGreetingMessage(score) {
        if (score >= 300) return "🍌 Banana Genius! 🍌";
        if (score >= 200) return "Great Math Skills!";
        if (score >= 100) return "Good Effort!";
        return "Try Again!";
    }
    
    // ==================== LOGOUT FUNCTIONALITY ====================
    document.getElementById('logout-btn').addEventListener('click', () => {
        clearGameIntervals();
        resetGameState();
        
        localStorage.removeItem('currentUser');
        mainContainer.classList.add('hidden');
        authContainer.style.display = 'flex';
        loginForm.style.display = 'block';
    });
    
    // ==================== INITIALIZATION ====================
    function checkLoggedIn() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            handleSuccessfulLogin(currentUser);
        }
    }
    
    function handleSuccessfulLogin(username) {
        authContainer.style.display = 'none';
        mainContainer.classList.remove('hidden');
        playerNameDisplay.textContent = username;
        resetGameState();
    }
    
    function validateAuthInput(username, password) {
        return username && password;
    }
    
    checkLoggedIn();
});