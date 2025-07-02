document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired.');
    // Screen elements
    const levelSelectionScreen = document.getElementById('level-selection-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');

    // Buttons
    const levelButtons = document.querySelectorAll('.level-btn');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const playAgainButton = document.getElementById('play-again-btn');

    // Display elements
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const phraseText = document.getElementById('phrase-text');
    const finalScoreDisplay = document.getElementById('final-score');
    const correctAnswersList = document.getElementById('correct-answers-list');
    const startScreenImage = document.getElementById('start-screen-image');
    const npcImage = document.getElementById('npc-image');
    const angerMarksDisplay = document.getElementById('anger-marks-display'); // Reference to the anger marks container
    const bodyElement = document.body; // For screen shake and red flash

    const backgroundImages = [
        'https://i.imgur.com/SGt0IIV.png',
        'https://i.imgur.com/FerFDR6.jpeg'
    ];

    const bgm = new Audio('Pixel Quest.mp3');
    bgm.loop = true;

    // Image URLs for director expressions
    const directorExpressions = {
        0: 'https://i.imgur.com/QyaMzSR.png', // 通常 (Normal)
        1: 'https://i.imgur.com/3Yl1CDs.png', // 不機嫌 (Frown)
        2: 'https://i.imgur.com/hmuAlNJ.png', // 怒り顔 (Angry)
        3: 'https://i.imgur.com/njLNobx.png'  // 爆怒 (Rage)
    };
    let score = 0;
    let timer = 0; // Initial timer will be set by qTime
    let timerInterval;
    let currentLevel = '監督'; // Always '監督' for this mode
    let questions = [];
    let allPhrases = [];
    let currentQuestionIndex = 0; // This will now be 'round'
    let correctAnswers = [];
    let mistakes = 0; // New: Track incorrect answers
    let round = 0;    // New: Track current round

    // --- Data Loading ---
    async function loadData() {
        try {
            const response = await fetch('phrase_templates.json');
            allPhrases = await response.json();
            console.log('Loaded phrases:', allPhrases); // Debug log
        } catch (error) {
            console.error('Failed to load phrase data:', error);
            phraseText.textContent = 'クイズデータの読み込みに失敗しました。';
        }
    }

    // --- Game Flow ---
    function startGame() { // No 'level' parameter needed as it's fixed
        console.log('startGame function called.');
        currentLevel = '監督';
        score = 0;
        mistakes = 0;
        round = 0;
        correctAnswers = [];
        questions = allPhrases; // Use all questions for this mode

        if (questions.length === 0) {
            phraseText.textContent = `クイズが見つかりませんでした。データを確認してください。`;
            quizScreen.classList.remove('hidden');
            levelSelectionScreen.classList.add('hidden');
            resultScreen.classList.add('hidden');
            return; // Stop here if no questions
        }

        // Shuffle all questions and then take the first 5
        questions.sort(() => Math.random() - 0.5);
        questions = questions.slice(0, 5); // Take only the first 5 questions

        updateScore(0);
        levelSelectionScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        // quizScreen.classList.remove('hidden'); // 画面切り替えを遅延

        const startSound = new Audio('start_game.mp3');
        startSound.play();

        startSound.onended = () => {
            quizScreen.classList.remove('hidden'); // 音声再生後に画面表示
            bgm.play(); // 音声再生後にBGM開始
        };

        // Set NPC image to normal director expression
        npcImage.src = directorExpressions[0];
        console.log(`Setting NPC image to normal director: ${directorExpressions[0]}`);

        startRound(); // Start the first round
    }

    function startRound() {
        if (round >= questions.length) {
            showEnding(); // All questions cleared
            return;
        }

        const question = questions[round];
        phraseText.textContent = question.jp; // Use 'jp' for the phrase

        // Prepare answer options using 'choices'
        let choices = [...question.choices]; // Create a copy to shuffle
        const correctAnswerText = question.choices[question.answer]; // Get the text of the correct answer

        // Shuffle choices
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }

        answerButtons.forEach((button, index) => {
            button.textContent = choices[index];
            // Pass the text of the chosen answer to handleAnswer
            button.onclick = () => handleAnswer(choices[index] === correctAnswerText); 
        });

        startTimer(qTime(round)); // Start timer for the current round
    }

    function handleAnswer(isCorrect, isTimeOut = false) {
        stopTimer();
        const question = questions[round];

        if (isCorrect) {
            showPositive();
            updateScore(score + 10); // Basic score for now
            correctAnswers.push(question); // Store correct question for summary
            round++;
            startRound(); // Move to next round
        } else {
            mistakes++;
            updateAngerUI(mistakes);
            
            // Add shake effect
            document.body.classList.add('shake');
            setTimeout(() => {
                document.body.classList.remove('shake');
            }, 500); // Animation duration is 0.5s

            // Play punch sound
            const punchSound = new Audio('wrong_answer.mp3');
            punchSound.play();

            if (mistakes >= 3) {
                gameOver();
            } else if (isTimeOut) { // If it's a timeout, move to the next round
                round++;
                startRound();
            } else { // If it's a regular incorrect answer, continue the timer
                startTimer(timer * 1000); // `timer` は残り秒数なのでミリ秒に変換
            }
        }
    }

    function qTime(r) {
        return 10000; // Always 10 seconds
    }

    function updateAngerUI(mistakes) {
        console.log(`監督の怒りゲージ: ${mistakes}`);
        // Update director's expression
        if (directorExpressions[mistakes]) {
            npcImage.src = directorExpressions[mistakes];
        }


    }

    function gameOver() {
        bgm.pause();
        clearInterval(timerInterval);
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = 'ゲームオーバー！新人、もう帰れ！'; // Game over message
        correctAnswersList.innerHTML = ''; // Clear summary for game over
        console.log('ゲームオーバー！');

        // Play game over sound
        const gameOverSound = new Audio('game_over.mp3');
        gameOverSound.play();

        // Set NPC image to rage expression
        npcImage.src = directorExpressions[3];

        // Blackout effect
        const blackoutDiv = document.createElement('div');
        blackoutDiv.classList.add('blackout');
        blackoutDiv.textContent = '新人、もう帰れ！';
        document.body.appendChild(blackoutDiv);
        setTimeout(() => {
            blackoutDiv.classList.add('active');
        }, 10);

        // Remove blackout after a delay and show retry
        setTimeout(() => {
            document.body.removeChild(blackoutDiv);
            resetGame(); // Show the start screen for retry
        }, 3000); // Blackout for 3 seconds
    }

    function showEnding() {
        bgm.pause();
        clearInterval(timerInterval);
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = `お見事！監督ニッコリ！最終スコア: ${score}`; // Ending message
        displaySummary();
        console.log('エンディング！');
    }

    function showPositive() {
        console.log('正解！');
        const correctSound = new Audio('correct_answer.mp3');
        correctSound.play();
        // TODO: Implement positive feedback UI (e.g., temporary happy face, sound)
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function setRandomBackground() {
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        document.body.style.backgroundImage = `url(${backgroundImages[randomIndex]})`;
    }

    function resetGame() {
        resultScreen.classList.add('hidden');
        levelSelectionScreen.classList.remove('hidden');
        startScreenImage.src = directorExpressions[0]; // Ensure default image on reset
    }

    // --- UI & Timer Updates ---
    function updateScore(newScore) {
        score = newScore;
        scoreDisplay.textContent = score;
    }

    function startTimer(duration) {
        clearInterval(timerInterval); // Clear any existing timer
        timerDisplay.classList.remove('warning', 'critical', 'explosion'); // Reset classes
        timer = duration / 1000; // Convert ms to seconds for display
        timerDisplay.textContent = timer;
        timerInterval = setInterval(() => {
            timer--;
            timerDisplay.textContent = timer;

            // Update timer color based on remaining time
            if (timer <= 5) {
                timerDisplay.classList.add('critical');
            } else if (timer <= 10) {
                timerDisplay.classList.add('warning');
            } else {
                timerDisplay.classList.remove('warning', 'critical');
            }

            if (timer <= 0) {
                stopTimer();
                timerDisplay.classList.add('explosion'); // Add explosion class
                handleAnswer(false, true); // Treat time over as an incorrect answer and indicate it's a timeout
            }
        }, 1000);
    }

    function displaySummary() {
        correctAnswersList.innerHTML = ''; // Clear previous results
        if (correctAnswers.length === 0) {
            correctAnswersList.innerHTML = '<li>正解した問題はありませんでした。</li>';
            return;
        }
        correctAnswers.forEach(q => {
            const li = document.createElement('li');
            li.textContent = `${q.jp} → ${q.choices[q.answer]}`; // Display original phrase and correct choice
            correctAnswersList.appendChild(li);
        });
    }

    // --- Event Listeners ---
    levelButtons.forEach(button => {
        console.log('Attaching click listener to level button.');
        button.addEventListener('click', () => {
            console.log('Level button clicked.');
            startGame(); // No level parameter needed
        });
    });

    // Set initial image to 監督
    startScreenImage.src = directorExpressions[0];

    playAgainButton.addEventListener('click', () => {
        setRandomBackground();
        resetGame();
    });

    // --- Initial Load ---
    setRandomBackground();
    loadData();
});
