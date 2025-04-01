document.addEventListener('DOMContentLoaded', function() {
    // Game elements
    const questionImage = document.getElementById('question-image');
    const questionText = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    // Stats elements
    const scoreElement = document.getElementById('score');
    const timeElement = document.getElementById('time');
    const streakElement = document.getElementById('streak');
    const finalScoreElement = document.getElementById('final-score');
    
    // Containers
    const quizContainer = document.querySelector('.quiz-container');
    const resultContainer = document.querySelector('.result-container');
    const resultMessage = document.getElementById('result-message');
    const gameOverContainer = document.querySelector('.game-over');
    
    // Game variables
    let score = 0;
    let streak = 0;
    let timeLeft = 60;
    let timer;
    let currentQuestion = {};
    let correctAnswer;
    
    // Initialize the game
    initGame();
    
    // Event listeners
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', restartGame);
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    function initGame() {
        score = 0;
        streak = 0;
        timeLeft = 60;
        scoreElement.textContent = score;
        streakElement.textContent = streak;
        timeElement.textContent = timeLeft;
        
        quizContainer.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        gameOverContainer.classList.add('hidden');
        
        startTimer();
        fetchQuestion();
    }
    
    function startTimer() {
        clearInterval(timer);
        timer = setInterval(() => {
            timeLeft--;
            timeElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    async function fetchQuestion() {
        try {
            // In a production environment, you would call your PHP endpoint here
            // For development, we'll use a direct API call (note: this may have CORS issues)
            const response = await fetch('https://marcconrad.com/uob/banana/api.php');
            const data = await response.json();
            
            currentQuestion = data;
            correctAnswer = parseInt(data.solution);
            
            // Display the question
            questionImage.innerHTML = `<img src="${data.question}" alt="Maths question">`;
            questionText.textContent = "How many bananas are there?";
            
            // Reset UI
            answerInput.value = '';
            answerInput.focus();
            resultContainer.classList.add('hidden');
            quizContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching question:', error);
            // Fallback question if API fails
            currentQuestion = {
                question: "https://marcconrad.com/uob/banana/example1.png",
                solution: "7"
            };
            correctAnswer = 7;
            questionImage.innerHTML = '<img src="https://marcconrad.com/uob/banana/example1.png" alt="Maths question">';
            questionText.textContent = "How many bananas are there?";
        }
    }
    
    function checkAnswer() {
        const userAnswer = parseInt(answerInput.value);
        
        if (isNaN(userAnswer)) {
            alert('Please enter a valid number');
            return;
        }
        
        if (userAnswer === correctAnswer) {
            // Correct answer
            score += 10 + (streak * 5);
            streak++;
            resultMessage.textContent = `🍌 Correct! 🍌`;
            resultMessage.className = 'correct';
        } else {
            // Incorrect answer
            streak = 0;
            resultMessage.textContent = `Wrong! The correct answer was ${correctAnswer}.`;
            resultMessage.className = 'incorrect';
        }
        
        // Update stats
        scoreElement.textContent = score;
        streakElement.textContent = streak;
        
        // Show result and hide quiz
        quizContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
    }
    
    function nextQuestion() {
        fetchQuestion();
    }
    
    function endGame() {
        clearInterval(timer);
        quizContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
        gameOverContainer.classList.remove('hidden');
        finalScoreElement.textContent = score;
    }
    
    function restartGame() {
        initGame();
    }
});