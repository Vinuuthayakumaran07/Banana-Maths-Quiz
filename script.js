// Initialize game variables
let score = 0;
let streak = 0;
let timeLeft = 40;
let timer;
let currentQuestion = {};
let correctAnswer;
let currentDifficulty = 'easy';
let hintInterval;

// DOM elements
const authContainer = document.getElementById('auth-container');
const mainContainer = document.querySelector('.container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');
const playerNameDisplay = document.getElementById('player-name');
const questionImage = document.getElementById('question-image');
const questionText = document.getElementById('question-text');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const hintContainer = document.getElementById('hint-container');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const streakElement = document.getElementById('streak');
const difficultyDisplay = document.getElementById('current-difficulty');
const finalScoreElement = document.getElementById('final-score');
const greetingMessage = document.querySelector('.greeting-message');

// ==================== AUTHENTICATION SYSTEM ====================
// Form toggle functions
function toggleForms(hideForm, showForm) {
    hideForm.style.display = 'none';
    showForm.style.display = 'block';
}

// Form toggle event listeners
document.getElementById('show-signup').addEventListener('click', () => toggleForms(loginForm, signupForm));
document.getElementById('show-login').addEventListener('click', () => toggleForms(signupForm, loginForm));
document.getElementById('show-forgot').addEventListener('click', () => toggleForms(loginForm, forgotForm));
document.getElementById('show-login-from-forgot').addEventListener('click', () => toggleForms(forgotForm, loginForm));

// Signup function - updated to use only Auth
document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const confirm = document.getElementById('signup-confirm').value.trim();
    
    if (!validateSignup(email, username, password, confirm)) return;
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                },
                emailRedirectTo: window.location.origin
            }
        });
        
        if (error) {
            if (error.message.includes('already registered')) {
                alert('This email is already registered. Please login instead.');
                toggleForms(signupForm, loginForm);
            } else {
                throw error;
            }
            return;
        }
        
        alert('Account created successfully! Please check your email for verification.');
        toggleForms(signupForm, loginForm);
        clearSignupForm();
    } catch (error) {
        console.error('Signup error:', error);
        alert(`Signup failed: ${error.message || 'Please try again'}`);
    }
});

function validateSignup(email, username, password, confirm) {
    if (!email || !username || !password || !confirm) {
        alert('Please fill all fields');
        return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address');
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
    
    return true;
}

function clearSignupForm() {
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm').value = '';
}

// Login function
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                alert('Invalid email or password');
            } else {
                throw error;
            }
            return;
        }
        
        // Get username from user metadata
        const username = data.user.user_metadata?.username || email.split('@')[0];
        localStorage.setItem('currentUser', username);
        handleSuccessfulLogin(username);
    } catch (error) {
        console.error('Login error:', error);
        alert(`Login failed: ${error.message || 'Please try again'}`);
    }
});

// Password reset function
document.getElementById('reset-btn').addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.trim();
    
    if (!email) {
        alert('Please enter your email');
        return;
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html'
        });
        
        if (error) throw error;
        
        alert('Password reset link sent to your email!');
        toggleForms(forgotForm, loginForm);
        document.getElementById('forgot-email').value = '';
    } catch (error) {
        console.error('Password reset error:', error);
        alert(`Error sending reset link: ${error.message || 'Please try again'}`);
    }
});

// ==================== GAME SYSTEM ====================
// Initialize the game
function initGame(difficulty) {
    resetGameState();
    currentDifficulty = difficulty;
    
    // Set time based on difficulty
    timeLeft = difficulty === 'easy' ? 40 : difficulty === 'medium' ? 20 : 10;
    
    difficultyDisplay.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    updateStatsDisplay();
    
    document.querySelector('.difficulty-selector').classList.add('hidden');
    document.querySelector('.game-area').classList.remove('hidden');
    document.querySelector('.quiz-container').classList.remove('hidden');
    
    startTimer();
    fetchQuestion();
}

function resetGameState() {
    score = 0;
    streak = 0;
    clearInterval(timer);
    clearInterval(hintInterval);
    updateStatsDisplay();
}

function updateStatsDisplay() {
    scoreElement.textContent = score;
    streakElement.textContent = streak;
    timeElement.textContent = timeLeft;
}

// Difficulty buttons
document.getElementById('easy-btn').addEventListener('click', () => initGame('easy'));
document.getElementById('medium-btn').addEventListener('click', () => initGame('medium'));
document.getElementById('hard-btn').addEventListener('click', () => initGame('hard'));

// Game event listeners
submitBtn.addEventListener('click', checkAnswer);
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', showDifficultySelector);
answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAnswer();
});

function showDifficultySelector() {
    document.querySelector('.difficulty-selector').classList.remove('hidden');
    document.querySelector('.game-over').classList.add('hidden');
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
    document.querySelector('.result-container').classList.add('hidden');
    document.querySelector('.quiz-container').classList.remove('hidden');
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
    document.getElementById('result-message').textContent = `🍌 Correct! +${points} points 🍌`;
    document.getElementById('result-message').className = 'correct';
}

function handleIncorrectAnswer() {
    streak = 0;
    document.getElementById('result-message').textContent = `Wrong! The correct answer was ${correctAnswer}.`;
    document.getElementById('result-message').className = 'incorrect';
}

function showResult() {
    document.querySelector('.quiz-container').classList.add('hidden');
    document.querySelector('.result-container').classList.remove('hidden');
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
    document.querySelector('.quiz-container').classList.add('hidden');
    document.querySelector('.result-container').classList.add('hidden');
}

function showFinalResults() {
    document.querySelector('.game-over').classList.remove('hidden');
    finalScoreElement.textContent = score;
    greetingMessage.textContent = getGreetingMessage(score);
}

async function updateHighScore() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Get current high score
        const { data: userData, error: selectError } = await supabase
            .from('users')
            .select('high_score')
            .eq('uid', user.id)
            .single();
        
        if (selectError) throw selectError;
        
        // Update if current score is higher
        if (!userData?.high_score || score > userData.high_score) {
            const { error: updateError } = await supabase
                .from('users')
                .upsert({ 
                    uid: user.id,
                    email: user.email,
                    username: user.user_metadata?.username,
                    high_score: score 
                });
            
            if (updateError) throw updateError;
        }
    } catch (error) {
        console.error('Error updating high score:', error);
    }
}

function getGreetingMessage(score) {
    if (score >= 300) return "🍌 Banana Genius! 🍌";
    if (score >= 200) return "Great Math Skills!";
    if (score >= 100) return "Good Effort!";
    return "Try Again!";
}

// ==================== LOGOUT FUNCTION ====================
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await supabase.auth.signOut();
        localStorage.removeItem('currentUser');
        mainContainer.classList.add('hidden');
        authContainer.style.display = 'flex';
        loginForm.style.display = 'block';
        resetGameState();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// ==================== INITIALIZATION ====================
function handleSuccessfulLogin(username) {
    authContainer.style.display = 'none';
    mainContainer.classList.remove('hidden');
    playerNameDisplay.textContent = username;
    resetGameState();
}

// Check if user is already logged in
async function checkLoggedIn() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const username = user.user_metadata?.username || user.email.split('@')[0];
            localStorage.setItem('currentUser', username);
            handleSuccessfulLogin(username);
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

// Initialize the app
checkLoggedIn();