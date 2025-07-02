document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired.');
    // Screen elements
    const levelSelectionScreen = document.getElementById('level-selection-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const dictionaryScreen = document.getElementById('dictionary-screen'); // New

    // Buttons
    const levelButtons = document.querySelectorAll('.level-btn');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const playAgainButton = document.getElementById('play-again-btn');
    const openDictionaryButton = document.getElementById('open-dictionary-btn'); // New
    const backToStartFromDictionaryButton = document.getElementById('back-to-start-from-dictionary-btn'); // New

    // Display elements
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const phraseText = document.getElementById('phrase-text');
    const finalScoreDisplay = document.getElementById('final-score');
    const correctAnswersList = document.getElementById('correct-answers-list');
    const startScreenImage = document.getElementById('start-screen-image');
    const npcImage = document.getElementById('npc-image');
    const angerMarksDisplay = document.getElementById('anger-marks-display');
    const bodyElement = document.body;

    const fullDictionaryList = document.getElementById('full-dictionary-list'); // New
    const correctTermsList = document.getElementById('correct-terms-list'); // New

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
    let timer = 0;
    let timerInterval;
    let currentLevel = '監督';
    let questions = [];
    let allPhrases = [];
    let portTerms = []; // New: To store dictionary terms
    let currentQuestionIndex = 0;
    let correctAnswers = []; // Stores the full question object
    let correctlyAnsweredTerms = new Set(); // New: Stores unique terms from correct answers
    let mistakes = 0;
    let round = 0;

    // --- Data Loading ---
    async function loadData() {
        try {
            const [phrasesResponse, termsResponse] = await Promise.all([
                fetch('phrase_templates.json'),
                fetch('port_terms.json') // Fetch port_terms.json
            ]);
            allPhrases = await phrasesResponse.json();
            portTerms = await termsResponse.json(); // Store port terms
            console.log('Loaded phrases:', allPhrases);
            console.log('Loaded port terms:', portTerms);
        } catch (error) {
            console.error('Failed to load data:', error);
            phraseText.textContent = 'データの読み込みに失敗しました。';
        }
    }

    // --- Game Flow ---
    function startGame() {
        console.log('startGame function called.');
        currentLevel = '監督';
        score = 0;
        mistakes = 0;
        round = 0;
        correctAnswers = [];
        correctlyAnsweredTerms.clear(); // Clear for new game
        questions = allPhrases;

        if (questions.length === 0) {
            phraseText.textContent = `クイズが見つかりませんでした。データを確認してください。`;
            quizScreen.classList.remove('hidden');
            levelSelectionScreen.classList.add('hidden');
            resultScreen.classList.add('hidden');
            return;
        }

        questions.sort(() => Math.random() - 0.5);
        questions = questions.slice(0, 5);

        updateScore(0);
        levelSelectionScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        dictionaryScreen.classList.add('hidden'); // Ensure dictionary is hidden

        const startSound = new Audio('start_game.mp3');
        startSound.play();

        startSound.onended = () => {
            quizScreen.classList.remove('hidden');
            bgm.play();
        };

        npcImage.src = directorExpressions[0];
        console.log(`Setting NPC image to normal director: ${directorExpressions[0]}`);

        startRound();
    }

    function startRound() {
        if (round >= questions.length) {
            showEnding();
            return;
        }

        const question = questions[round];
        phraseText.textContent = question.jp;

        let choices = [...question.choices];
        const correctAnswerText = question.choices[question.answer];

        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }

        answerButtons.forEach((button, index) => {
            button.textContent = choices[index];
            button.onclick = () => handleAnswer(choices[index] === correctAnswerText, question);
        });

        startTimer(qTime(round));
    }

    function handleAnswer(isCorrect, question, isTimeOut = false) {
        stopTimer();

        if (isCorrect) {
            showPositive();
            updateScore(score + 10);
            correctAnswers.push(question);

            // Identify and store terms from the correctly answered phrase
            portTerms.forEach(termEntry => {
                if (question.jp.includes(termEntry.term)) {
                    correctlyAnsweredTerms.add(JSON.stringify(termEntry)); // Store as string to ensure uniqueness in Set
                }
            });

            round++;
            startRound();
        } else {
            mistakes++;
            updateAngerUI(mistakes);

            document.body.classList.add('shake');
            setTimeout(() => {
                document.body.classList.remove('shake');
            }, 500);

            const punchSound = new Audio('wrong_answer.mp3');
            punchSound.play();

            if (mistakes >= 3) {
                gameOver();
            } else if (isTimeOut) {
                round++;
                startRound();
            } else {
                // If not timeout, and incorrect, just continue the timer for the current question
                // No need to restart timer, it's already running.
                // The original code had `startTimer(timer * 1000);` which would restart the timer.
                // If the intention is to penalize by reducing time, that logic needs to be explicit.
                // For now, just let the timer continue.
            }
        }
    }

    function qTime(r) {
        return 10000;
    }

    function updateAngerUI(mistakes) {
        console.log(`監督の怒りゲージ: ${mistakes}`);
        if (directorExpressions[mistakes]) {
            npcImage.src = directorExpressions[mistakes];
        }
    }

    function gameOver() {
        bgm.pause();
        clearInterval(timerInterval);
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = 'ゲームオーバー！新人、もう帰れ！';
        correctAnswersList.innerHTML = '';
        correctTermsList.innerHTML = ''; // Clear correct terms list
        console.log('ゲームオーバー！');

        const gameOverSound = new Audio('game_over.mp3');
        gameOverSound.play();

        npcImage.src = directorExpressions[3];

        const blackoutDiv = document.createElement('div');
        blackoutDiv.classList.add('blackout');
        blackoutDiv.textContent = '新人、もう帰れ！';
        document.body.appendChild(blackoutDiv);
        setTimeout(() => {
            blackoutDiv.classList.add('active');
        }, 10);

        setTimeout(() => {
            document.body.removeChild(blackoutDiv);
            resetGame();
        }, 3000);
    }

    function showEnding() {
        bgm.pause();
        clearInterval(timerInterval);
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = `お見事！監督ニッコリ！最終スコア: ${score}`;
        displaySummary();
        console.log('エンディング！');
    }

    function showPositive() {
        console.log('正解！');
        const correctSound = new Audio('correct_answer.mp3');
        correctSound.play();
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
        startScreenImage.src = directorExpressions[0];
    }

    // --- UI & Timer Updates ---
    function updateScore(newScore) {
        score = newScore;
        scoreDisplay.textContent = score;
    }

    function startTimer(duration) {
        clearInterval(timerInterval);
        timerDisplay.classList.remove('warning', 'critical', 'explosion');
        timer = duration / 1000;
        timerDisplay.textContent = timer;
        timerInterval = setInterval(() => {
            timer--;
            timerDisplay.textContent = timer;

            if (timer <= 5) {
                timerDisplay.classList.add('critical');
            } else if (timer <= 10) {
                timerDisplay.classList.add('warning');
            } else {
                timerDisplay.classList.remove('warning', 'critical');
            }

            if (timer <= 0) {
                stopTimer();
                timerDisplay.classList.add('explosion');
                handleAnswer(false, questions[round], true); // Pass current question for timeout
            }
        }, 1000);
    }

    function displaySummary() {
        correctAnswersList.innerHTML = '';
        if (correctAnswers.length === 0) {
            correctAnswersList.innerHTML = '<li>正解した問題はありませんでした。</li>';
        } else {
            correctAnswers.forEach(q => {
                const li = document.createElement('li');
                li.textContent = `${q.jp} → ${q.choices[q.answer]}`;
                correctAnswersList.appendChild(li);
            });
        }

        // Populate the correct terms dictionary
        correctTermsList.innerHTML = '';
        if (correctlyAnsweredTerms.size === 0) {
            correctTermsList.innerHTML = '<li>正解した問題に関連する用語はありませんでした。</li>';
        } else {
            Array.from(correctlyAnsweredTerms).map(JSON.parse).forEach(termEntry => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${termEntry.term}</strong>: ${termEntry.meaning}`;
                correctTermsList.appendChild(li);
            });
        }
    }

    // --- Dictionary Functions ---
    function showDictionaryScreen() {
        levelSelectionScreen.classList.add('hidden');
        quizScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        dictionaryScreen.classList.remove('hidden');
        populateFullDictionary();
    }

    function hideDictionaryScreen() {
        dictionaryScreen.classList.add('hidden');
        levelSelectionScreen.classList.remove('hidden');
    }

    function populateFullDictionary() {
        fullDictionaryList.innerHTML = '';
        if (portTerms.length === 0) {
            fullDictionaryList.innerHTML = '<li>用語データがありません。</li>';
            return;
        }
        portTerms.forEach(termEntry => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${termEntry.term}</strong>: ${termEntry.meaning}`;
            fullDictionaryList.appendChild(li);
        });
    }

    // --- Event Listeners ---
    levelButtons.forEach(button => {
        console.log('Attaching click listener to level button.');
        button.addEventListener('click', () => {
            console.log('Level button clicked.');
            startGame();
        });
    });

    startScreenImage.src = directorExpressions[0];

    playAgainButton.addEventListener('click', () => {
        setRandomBackground();
        resetGame();
    });

    openDictionaryButton.addEventListener('click', showDictionaryScreen); // New listener
    backToStartFromDictionaryButton.addEventListener('click', hideDictionaryScreen); // New listener

    // --- Initial Load ---
    setRandomBackground();
    loadData();
});