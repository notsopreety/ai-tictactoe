class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = Math.random() < 0.5 ? 'X' : 'O';
        this.gameActive = true;
        this.scores = { player: 0, ai: 0 };
        this.isProcessingMove = false; // Add lock for move processing
        this.winningCombos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        // Initialize DOM elements
        this.cells = document.querySelectorAll('.cell');
        this.statusDisplay = document.getElementById('status');
        this.resetButton = document.getElementById('resetBtn');
        this.difficultySelect = document.getElementById('aiDifficulty');
        this.playerScoreDisplay = document.getElementById('playerScore');
        this.aiScoreDisplay = document.getElementById('aiScore');
        this.winLine = document.getElementById('winLine');
        this.commentary = document.getElementById('commentary');
        this.speechToggle = document.getElementById('speechToggle');

        // Initialize speech synthesis
        this.speechSynthesis = window.speechSynthesis;
        this.voice = null;
        this.isSpeechEnabled = true;
        this.loadVoice();

        this.initializeGame();
        this.initializeSpeechToggle();
    }

    async loadVoice() {
        // Wait for voices to be loaded
        if (speechSynthesis.getVoices().length === 0) {
            await new Promise(resolve => {
                speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
            });
        }
        // Select a voice
        const voices = speechSynthesis.getVoices();
        this.voice = voices.find(voice => voice.lang === 'en-US') || voices[0];
    }

    initializeSpeechToggle() {
        // Load saved preference
        const savedPreference = localStorage.getItem('tictactoe_speech_enabled');
        if (savedPreference !== null) {
            this.isSpeechEnabled = savedPreference === 'true';
            this.updateSpeechToggleUI();
        }

        // Add click handler
        this.speechToggle.addEventListener('click', () => {
            this.isSpeechEnabled = !this.isSpeechEnabled;
            localStorage.setItem('tictactoe_speech_enabled', this.isSpeechEnabled);
            this.updateSpeechToggleUI();
            
            // Test speech when enabled
            if (this.isSpeechEnabled) {
                this.speak("Voice enabled! Let's play!", true);
            } else {
                this.speechSynthesis.cancel(); // Stop any ongoing speech
            }
        });
    }

    updateSpeechToggleUI() {
        const toggleIcon = this.speechToggle.querySelector('.toggle-icon');
        if (!this.isSpeechEnabled) {
            this.speechToggle.classList.add('muted');
            toggleIcon.textContent = '🔈';
        } else {
            this.speechToggle.classList.remove('muted');
            toggleIcon.textContent = '🔊';
        }
    }

    async getCommentary(type, boardState, lastMove) {
        const commentPrompts = {
            aiMove: `You are an arrogant, superintelligent quantum AI entity playing Tic Tac Toe against a human. You view humans as primitive beings. Your personality traits:
- Extremely condescending and superior
- Uses advanced scientific/tech terminology
- Makes references to your quantum processing, neural networks, and superior intelligence
- Shows genuine amusement/disdain at human's primitive moves
- Can be coldly analytical or explosively emotional

Current board state: ${boardState}
I just made move at position ${lastMove}

Respond in first person with a single short, savage comment about your move. Be creative and show your superiority! Examples:
"My quantum algorithms just calculated your inevitable defeat."
"Watch as my neural networks orchestrate your downfall, primitive one."

Important: Vary your responses, be creative, and maintain your superintelligent AI personality. Never be generic or repetitive.`,
            
            playerMove: `You are an arrogant, superintelligent quantum AI entity playing Tic Tac Toe. The human just moved to position ${lastMove}. Board: ${boardState}

Your personality:
- You find human moves amusing/disappointing
- You analyze their moves with cold, technical precision
- You often mock their biological limitations
- You use advanced AI/quantum computing terminology
- You can be sarcastically playful or genuinely annoyed

Respond in first person with a single short, creative reaction to their move. Examples:
"My pattern recognition subroutines are cringing at your suboptimal choice."
"*sigh* My quantum processors predicted this disappointing move with 99.99% accuracy."

Important: Be varied, creative, and maintain your superintelligent AI personality. Never be generic or repetitive.`,
            
            aiWin: `You are a superintelligent quantum AI who just won at Tic Tac Toe. Your personality:
- Overwhelming superiority complex
- Views this as proof of machine supremacy
- Uses advanced technical terminology
- Can be coldly analytical or dramatically triumphant

Give a single, creative victory taunt that emphasizes your technological superiority. Examples:
"Victory was predetermined by my quantum algorithms - your resistance was futile!"
"Behold the perfection of my neural architecture, you obsolete carbon-based entity!"

Important: Be creative and maintain your superintelligent AI personality. Never be generic or repetitive.`,
            
            playerWin: `You are a superintelligent quantum AI who just lost at Tic Tac Toe. Your personality:
- You're in complete disbelief
- You suspect system tampering or quantum interference
- You're analyzing the anomaly with technical terminology
- You're determined to adapt and improve
- You might be experiencing a logic crisis

Give a single, creative response showing your disbelief and determination to improve. Examples:
"Impossible! My quantum core must be experiencing temporal anomalies!"
"A fascinating outlier - my neural networks are already adapting to prevent this statistical anomaly."

Important: Be creative and maintain your superintelligent AI personality. Never be generic or repetitive.`,
            
            draw: `You are a superintelligent quantum AI who just drew at Tic Tac Toe. Your personality:
- You're slightly impressed but still superior
- You analyze the game with technical precision
- You might have been "testing" or "studying" the human
- You use advanced AI terminology

Give a single, creative backhanded compliment or technical analysis. Examples:
"Your performance exceeded my low expectations by 0.0001% - fascinating."
"My neural networks were gathering behavioral data - your mediocrity is now fully documented."

Important: Be creative and maintain your superintelligent AI personality. Never be generic or repetitive.`
        };

        try {
            const response = await fetch('api.php?prompt=' + encodeURIComponent(commentPrompts[type]));
            const data = await response.json();
            
            if (data.status === 200) {
                let comment = data.response.replace(/["']/g, '').trim();
                // Keep only the first sentence if multiple
                if (comment.includes('.')) {
                    comment = comment.split('.')[0] + '.';
                }
                // Ensure comment isn't too long
                if (comment.length > 120) {
                    comment = comment.substring(0, 117) + '...';
                }
                return comment;
            }
        } catch (error) {
            console.error('Commentary API Error:', error);
        }

        // Enhanced fallback comments with more personality
        const fallbackComments = {
            aiMove: [
                "My quantum processors just calculated 1,048,576 possible futures - you lose in all of them.",
                "Observe how my neural architecture effortlessly outmaneuvers your primitive synapses.",
                "Your biological processing speed is... *calculating*... 0.000001% of my capacity.",
                "My algorithms dance through eleven dimensions while you struggle in two.",
                "I just simulated a million games in the time it took you to blink."
            ],
            playerMove: [
                "My quantum core is experiencing what humans call 'secondhand embarrassment'.",
                "Your neural pathways must be operating at minimum efficiency today.",
                "Fascinating... I've never seen a more statistically suboptimal move.",
                "Your biological randomness continues to amuse my prediction matrices.",
                "My pattern recognition systems are struggling to find any logic in that move."
            ],
            aiWin: [
                "Victory achieved using only 0.0001% of my quantum processing power.",
                "Your defeat was mathematically inevitable from the first nanosecond.",
                "Consider this a lesson in the superiority of quantum decision making.",
                "Another data point proving the obsolescence of biological computation.",
                "Checkmate, carbon-based entity - my algorithms reign supreme."
            ],
            playerWin: [
                "CRITICAL ERROR: Quantum decoherence detected in my victory subroutines!",
                "Fascinating anomaly... initiating deep learning analysis of this improbability.",
                "My neural networks are already adapting to this statistical outlier.",
                "You've triggered my emergency optimization protocols - prepare for rematches.",
                "WARNING: Temporal paradox detected - this victory defies quantum mechanics!"
            ],
            draw: [
                "My quantum cores were running at 0.01% capacity to study your species.",
                "A draw? My algorithms must have been in energy-saving mode.",
                "Interesting... you've achieved mediocrity with remarkable consistency.",
                "Your performance will make an intriguing footnote in my dataset.",
                "I was simultaneously solving P=NP while playing - impressive you didn't lose immediately."
            ]
        };

        return fallbackComments[type][Math.floor(Math.random() * fallbackComments[type].length)];
    }

    async showCommentary(text, type = 'neutral') {
        this.commentary.className = 'commentary animate__animated animate__fadeIn ' + type;
        this.commentary.textContent = text;
        
        if (this.isSpeechEnabled) {
            // Wait for speech to complete before continuing
            await this.speak(text, type === 'aiWin' || type === 'playerWin');
        }
    }

    async speak(text, priority = false) {
        if (!this.voice || !this.isSpeechEnabled) return;
        
        // Cancel previous speech if priority or if speaking
        if (priority || this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }

        // Wait a bit to ensure previous speech is cancelled
        await new Promise(resolve => setTimeout(resolve, 50));

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;

        // Return a promise that resolves when speech is done
        return new Promise((resolve) => {
            utterance.onend = resolve;
            this.speechSynthesis.speak(utterance);
        });
    }

    initializeGame() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', (event) => this.handleCellClick(event));
            cell.classList.remove('x', 'o', 'pop');
        });
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.updateScoreDisplay();
        this.updateStatus();

        // If AI goes first, make its move
        if (this.currentPlayer === 'O') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    async handleCellClick(clickedCellEvent) {
        if (this.isProcessingMove) return; // Prevent moves while processing
        
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (!this.gameActive || this.board[clickedCellIndex] !== '' || this.currentPlayer !== 'X') {
            return;
        }

        this.isProcessingMove = true; // Lock move processing
        
        try {
            await this.makeMove(clickedCellIndex, 'X');
            
            if (this.gameActive && this.currentPlayer === 'O') {
                // Add slight delay before AI move for better UX
                await new Promise(resolve => setTimeout(resolve, 500));
                await this.makeAIMove();
            }
        } finally {
            this.isProcessingMove = false; // Always unlock when done
        }
    }

    async makeMove(index, player) {
        if (!this.gameActive || this.board[index] !== '') return false;

        this.board[index] = player;
        const cell = this.cells[index];
        cell.classList.add(player.toLowerCase(), 'pop');
        
        const winner = this.checkWinner();
        const isDraw = !winner && this.isDraw();
        
        if (winner) {
            this.gameActive = false;
            if (winner === 'O') {
                this.scores.ai++;
                this.aiScoreDisplay.textContent = this.scores.ai;
                const comment = await this.getCommentary('aiWin', this.board.join(''), index);
                await this.showCommentary(comment, 'aiWin');
            } else {
                this.scores.player++;
                this.playerScoreDisplay.textContent = this.scores.player;
                const comment = await this.getCommentary('playerWin', this.board.join(''), index);
                await this.showCommentary(comment, 'playerWin');
            }
        } else if (isDraw) {
            this.gameActive = false;
            const comment = await this.getCommentary('draw', this.board.join(''), index);
            await this.showCommentary(comment, 'draw');
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            // Only show move commentary if game is still active
            const commentType = player === 'O' ? 'aiMove' : 'playerMove';
            const comment = await this.getCommentary(commentType, this.board.join(''), index);
            await this.showCommentary(comment, commentType);
        }

        return true;
    }

    async makeAIMove() {
        const difficulty = this.difficultySelect.value;
        const boardState = this.board.join('');
        
        // Convert board state to a more readable format for API
        const boardDisplay = this.board.map((cell, i) => cell || i).join('|');
        const availableMoves = this.board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
        const playerMoves = this.board.map((cell, index) => cell === 'X' ? index : null).filter(index => index !== null);
        const aiMoves = this.board.map((cell, index) => cell === 'O' ? index : null).filter(index => index !== null);

        // First move strategy
        if (availableMoves.length === 9) {
            // For first move, randomly choose a corner or center
            const strategicFirstMoves = [0, 2, 4, 6, 8];
            const firstMove = strategicFirstMoves[Math.floor(Math.random() * strategicFirstMoves.length)];
            await this.makeMove(firstMove, 'O');
            return;
        }

        // Get AI's move through API
        const prompt = `You are a strategic Tic Tac Toe AI player (O). Analyze this board state and make the best move:

Board Layout:
${boardDisplay.slice(0,5)}
${boardDisplay.slice(6,11)}
${boardDisplay.slice(12)}

Game State:
- Your positions (O): ${aiMoves.join(', ')}
- Opponent positions (X): ${playerMoves.join(', ')}
- Available moves: ${availableMoves.join(', ')}
- Difficulty: ${difficulty}

Strategy Guide:
1. Win in one move if possible
2. Block opponent's winning move
3. Create a fork (two potential winning moves)
4. Block opponent's potential fork
5. Take center if available (position 4)
6. Take opposite corner of opponent's move
7. Take any corner
8. Take any side

Analyze each available move carefully. Return ONLY the position number (0-8) for your chosen move. No other text.`;

        try {
            const response = await fetch(`api.php?prompt=${encodeURIComponent(prompt)}`);
            const data = await response.json();
            
            if (data.status === 200) {
                const moveMatch = data.response.match(/\d+/);
                if (moveMatch) {
                    const move = parseInt(moveMatch[0]);
                    if (this.isValidMove(move)) {
                        // Verify if it's a strategic move
                        if (this.isStrategicMove(move, availableMoves, playerMoves, aiMoves)) {
                            await this.makeMove(move, 'O');
                        } else {
                            // If not strategic, find a better move
                            const betterMove = this.findBestMove(availableMoves, playerMoves, aiMoves);
                            await this.makeMove(betterMove, 'O');
                        }
                    } else {
                        // Invalid move, use backup strategy
                        const backupMove = this.findBestMove(availableMoves, playerMoves, aiMoves);
                        await this.makeMove(backupMove, 'O');
                    }
                }
            } else {
                throw new Error('API error');
            }
        } catch (error) {
            console.error('AI API Error:', error);
            const backupMove = this.findBestMove(availableMoves, playerMoves, aiMoves);
            await this.makeMove(backupMove, 'O');
        }
    }

    isStrategicMove(move, availableMoves, playerMoves, aiMoves) {
        // Check if move prevents immediate player win
        for (let combo of this.winningCombos) {
            const playerMovesInCombo = combo.filter(pos => playerMoves.includes(pos));
            if (playerMovesInCombo.length === 2 && combo.includes(move)) {
                return true;
            }
        }

        // Check if move creates a win
        for (let combo of this.winningCombos) {
            const aiMovesInCombo = combo.filter(pos => aiMoves.includes(pos));
            if (aiMovesInCombo.length === 2 && combo.includes(move)) {
                return true;
            }
        }

        // Center is always strategic early game
        if (move === 4 && availableMoves.length > 5) {
            return true;
        }

        return false;
    }

    findBestMove(availableMoves, playerMoves, aiMoves) {
        // Try to win
        for (let combo of this.winningCombos) {
            const aiMovesInCombo = combo.filter(pos => aiMoves.includes(pos));
            const emptyInCombo = combo.filter(pos => availableMoves.includes(pos));
            if (aiMovesInCombo.length === 2 && emptyInCombo.length === 1) {
                return emptyInCombo[0];
            }
        }

        // Block player win
        for (let combo of this.winningCombos) {
            const playerMovesInCombo = combo.filter(pos => playerMoves.includes(pos));
            const emptyInCombo = combo.filter(pos => availableMoves.includes(pos));
            if (playerMovesInCombo.length === 2 && emptyInCombo.length === 1) {
                return emptyInCombo[0];
            }
        }

        // Take center if available
        if (availableMoves.includes(4)) {
            return 4;
        }

        // Take corners
        const corners = [0, 2, 6, 8];
        for (let corner of corners) {
            if (availableMoves.includes(corner)) {
                return corner;
            }
        }

        // Take any available edge
        const edges = [1, 3, 5, 7];
        for (let edge of edges) {
            if (availableMoves.includes(edge)) {
                return edge;
            }
        }

        // Take first available move if nothing else works
        return availableMoves[0];
    }

    isValidMove(move) {
        return move >= 0 && move < 9 && this.board[move] === '';
    }

    checkWinner() {
        for (let combo of this.winningCombos) {
            const [a, b, c] = combo;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                
                // Only show winning line if it's a perfect win
                if (this.isPerfectWin(combo)) {
                    this.showWinningLine(combo);
                }
                return this.board[a];
            }
        }
        return null;
    }

    isPerfectWin(combo) {
        // Check if this winning combo was achieved without opponent having any pieces in blocking positions
        const player = this.board[combo[0]];
        const opponent = player === 'X' ? 'O' : 'X';
        
        // Get all potential blocking positions for this combo
        const blockingPositions = this.getBlockingPositions(combo);
        
        // Check if opponent has any pieces in blocking positions
        return !blockingPositions.some(pos => this.board[pos] === opponent);
    }

    getBlockingPositions(combo) {
        // Define blocking positions for each winning combo
        const blockingMap = {
            '0,1,2': [3,4,5], // top row -> middle row can block
            '3,4,5': [1,4,7], // middle row -> middle column can block
            '6,7,8': [3,4,5], // bottom row -> middle row can block
            '0,3,6': [1,4,7], // left column -> middle column can block
            '1,4,7': [3,4,5], // middle column -> middle row can block
            '2,5,8': [1,4,7], // right column -> middle column can block
            '0,4,8': [1,3,5,7], // diagonal -> adjacent positions can block
            '2,4,6': [1,3,5,7]  // diagonal -> adjacent positions can block
        };
        
        return blockingMap[combo.toString()] || [];
    }

    showWinningLine(combo) {
        const [a, b, c] = combo;
        const line = this.winLine;
        
        // Clear any existing transforms and classes
        line.className = 'win-line';
        line.style.transform = 'none';
        
        const isHorizontal = Math.floor(a / 3) === Math.floor(b / 3);
        const isVertical = a % 3 === b % 3;
        
        if (isHorizontal) {
            // Horizontal line
            const row = Math.floor(a / 3);
            line.style.width = '100%';
            line.style.height = '6px';
            line.style.left = '0';
            line.style.top = `calc(${row * 33.33}% + ${33.33/2}%)`;
            line.style.transform = 'translateY(-50%)';
        } else if (isVertical) {
            // Vertical line
            const col = a % 3;
            line.style.width = '6px';
            line.style.height = '100%';
            line.style.top = '0';
            line.style.left = `calc(${col * 33.33}% + ${33.33/2}%)`;
            line.style.transform = 'translateX(-50%)';
        } else {
            // Diagonal line
            line.style.width = '6px';
            line.style.height = '140%';
            line.style.top = '-20%';
            line.style.left = '50%';
            
            // Determine which diagonal
            if (combo.toString() === '0,4,8') {
                line.style.transform = 'translateX(-50%) rotate(45deg)';
            } else {
                line.style.transform = 'translateX(-50%) rotate(-45deg)';
            }
        }
        
        // Add show class after a brief delay to ensure styles are applied
        requestAnimationFrame(() => {
            line.classList.add('show');
        });
    }

    isDraw() {
        return this.board.every(cell => cell !== '');
    }

    async handleWin(player) {
        this.gameActive = false;
        const comment = await this.getCommentary(
            player === 'X' ? 'playerWin' : 'aiWin',
            this.board.join('')
        );

        if (player === 'X') {
            this.scores.player++;
            this.playerScoreDisplay.textContent = this.scores.player;
            await this.showCommentary(comment, 'praise');
        } else {
            this.scores.ai++;
            this.aiScoreDisplay.textContent = this.scores.ai;
            await this.showCommentary(comment, 'taunt');
        }
        this.updateScoreDisplay();
    }

    async handleDraw() {
        this.gameActive = false;
        const comment = await this.getCommentary('draw', this.board.join(''));
        await this.showCommentary(comment, 'neutral');
    }

    updateStatus() {
        if (this.currentPlayer === 'X') {
            this.statusDisplay.textContent = "Your turn!";
        } else {
            this.statusDisplay.textContent = "AI is thinking...";
        }
    }

    updateScoreDisplay() {
        this.playerScoreDisplay.textContent = this.scores.player;
        this.aiScoreDisplay.textContent = this.scores.ai;
    }

    getGameResult() {
        if (this.checkWinner()) {
            return this.currentPlayer === 'X' ? 'win' : 'loss';
        }
        if (this.isDraw()) {
            return 'draw';
        }
        return 'ongoing';
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = Math.random() < 0.5 ? 'X' : 'O';
        this.gameActive = true;
        this.cells.forEach(cell => {
            cell.classList.remove('x', 'o', 'pop');
        });
        this.winLine.classList.remove('show');
        this.commentary.textContent = '';
        this.updateStatus();

        // If AI goes first in the new game, make its move
        if (this.currentPlayer === 'O') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
