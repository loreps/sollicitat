class Tetris {
    constructor() {
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.board = [];
        this.score = 0;
        this.level = 1;
        this.gameOver = false;

        // Initialize rankings from localStorage
        this.rankings = JSON.parse(localStorage.getItem('tetrisRankings')) || [
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 }
        ];

        // Initialize ranking display
        this.updateRankingDisplay();
        this.currentPiece = null;
        this.gameInterval = null;
        this.speed = 1000; // Initial speed in milliseconds
        this.isPlaying = false;

        // Initialize the game board
        for (let i = 0; i < this.boardHeight; i++) {
            this.board[i] = new Array(this.boardWidth).fill(null);
        }

        // Tetromino shapes
        this.tetrominoes = {
            'I': [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            'O': [
                [1, 1],
                [1, 1]
            ],
            'T': [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            'S': [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            'Z': [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            'J': [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            'L': [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ]
        };

        this.setupBoard();
        this.setupControls();
    }

    setupBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.boardHeight; i++) {
            for (let j = 0; j < this.boardWidth; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-row', i);
                cell.setAttribute('data-col', j);
                gameBoard.appendChild(cell);
            }
        }
    }

    setupControls() {
        // Remove any existing event listeners
        window.onkeydown = null;
        
        // Add new event listener
        window.onkeydown = (e) => {
            if (this.gameOver && e.code === 'Space') {
                this.restart();
                return;
            }

            if (!this.isPlaying || this.gameOver) return;

            // Prevent default behavior for game controls
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }

            // Handle controls
            switch(e.code) {
                case 'ArrowLeft':
                    this.movePiece(-1);
                    break;
                case 'ArrowRight':
                    this.movePiece(1);
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
            }
        };
    }

    createNewPiece() {
        const pieces = Object.keys(this.tetrominoes);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        
        this.currentPiece = {
            shape: JSON.parse(JSON.stringify(this.tetrominoes[randomPiece])), // Deep copy
            type: randomPiece,
            x: Math.floor(this.boardWidth / 2) - Math.floor(this.tetrominoes[randomPiece][0].length / 2),
            y: 0
        };

        if (this.checkCollision()) {
            this.gameOver = true;
            this.isPlaying = false;
            clearInterval(this.gameInterval);
            this.updateRankings();
            stopGameMusic(); // Stop music on game over
            alert('Game Over! Score: ' + this.score + '\nPress SPACE to restart');
            return false;
        }
        return true;
    }

    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;

                    if (boardX < 0 || boardX >= this.boardWidth || 
                        boardY >= this.boardHeight ||
                        (boardY >= 0 && this.board[boardY][boardX] !== null)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    movePiece(direction) {
        if (!this.currentPiece) return;
        
        this.currentPiece.x += direction;
        if (this.checkCollision()) {
            this.currentPiece.x -= direction;
        }
        this.updateBoard();
    }

    moveDown() {
        if (!this.currentPiece) return;

        this.currentPiece.y++;
        if (this.checkCollision()) {
            this.currentPiece.y--;
            this.lockPiece();
            if (!this.createNewPiece()) {
                return;
            }
        }
        this.updateBoard();
    }

    rotatePiece() {
        if (!this.currentPiece) return;

        const originalShape = JSON.parse(JSON.stringify(this.currentPiece.shape)); // Deep copy
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        this.currentPiece.shape = rotated;
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
        this.updateBoard();
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    if (boardY >= 0) {
                        this.board[boardY][this.currentPiece.x + x] = this.currentPiece.type;
                    }
                }
            }
        }
        this.clearLines();
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== null)) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.boardWidth).fill(null));
                linesCleared++;
                y++; // Check the same row again
            }
        }

        if (linesCleared > 0) {
            this.updateScore(linesCleared);
        }
    }

    updateScore(linesCleared) {
        const points = [0, 100, 300, 500, 800]; // Points for 0, 1, 2, 3, 4 lines
        this.score += points[linesCleared];
        document.getElementById('score').textContent = this.score;
        
        // Update level (max 5 levels, increases every 500 points)
        const newLevel = Math.min(5, Math.floor(this.score / 500) + 1);
        
        if (newLevel !== this.level) {
            this.level = newLevel;
            document.getElementById('level').textContent = this.level;
            
            // Update speed (10% faster per level)
            // Base speed is 1000ms, each level reduces it by 10%
            this.speed = 1000 * Math.pow(0.9, this.level - 1);
            
            if (this.gameInterval) {
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.moveDown(), this.speed);
            }
        }
    }

    updateBoard() {
        // Clear the visual board
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell';
        });

        // Draw the locked pieces
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                if (this.board[y][x] !== null) {
                    const cell = document.querySelector(`[data-row="${y}"][data-col="${x}"]`);
                    if (cell) {
                        cell.classList.add('tetromino', this.board[y][x]);
                    }
                }
            }
        }

        // Draw the current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardY = this.currentPiece.y + y;
                        const boardX = this.currentPiece.x + x;
                        if (boardY >= 0) {
                            const cell = document.querySelector(`[data-row="${boardY}"][data-col="${boardX}"]`);
                            if (cell) {
                                cell.classList.add('tetromino', this.currentPiece.type);
                            }
                        }
                    }
                }
            }
        }
    }

    updateRankings() {
        if (this.score > 0) {
            const walletConnection = window.walletConnection;
            const wallet = walletConnection && walletConnection.account ? walletConnection.account : '0x000...000';
            
            // Add current score to rankings
            this.rankings.push({ wallet: wallet, score: this.score });
            
            // Sort rankings by score in descending order
            this.rankings.sort((a, b) => b.score - a.score);
            
            // Keep only top 5 scores
            this.rankings = this.rankings.slice(0, 5);
            
            // Save to localStorage
            localStorage.setItem('tetrisRankings', JSON.stringify(this.rankings));
            
            // Update ranking display
            this.updateRankingDisplay();
        }
    }

    updateRankingDisplay() {
        const leaderboardItems = document.querySelectorAll('.leaderboard-item');
        this.rankings.forEach((rank, index) => {
            if (leaderboardItems[index]) {
                leaderboardItems[index].querySelector('.player-name').textContent = rank.wallet;
                leaderboardItems[index].querySelector('.player-score').textContent = rank.score;
            }
        });
    }

    reset() {
        // Clear the board
        for (let i = 0; i < this.boardHeight; i++) {
            this.board[i] = new Array(this.boardWidth).fill(null);
        }
        
        // Reset game state
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.currentPiece = null;
        this.speed = 1000; // Reset to initial speed
        
        // Update display
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        
        // Clear any existing interval
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        this.updateBoard();
    }

    restart() {
        this.reset();
        this.isPlaying = true;
        this.updateRankingDisplay(); // Ensure rankings are displayed on restart
        
        // Restart game music
        const gameMusic = document.getElementById('gameMusic');
        gameMusic.currentTime = 0;
        gameMusic.play();
        
        if (this.createNewPiece()) {
            this.gameInterval = setInterval(() => this.moveDown(), this.speed);
        }
    }
}

let game = new Tetris();

function startGame() {
    if (game.isPlaying) {
        game.reset();
    }
    game.isPlaying = true;
    game.updateRankingDisplay(); // Ensure rankings are displayed
    
    // Start game music
    const gameMusic = document.getElementById('gameMusic');
    gameMusic.volume = 0.12; // Set volume to 12%
    gameMusic.currentTime = 0;
    gameMusic.play();
    
    if (game.createNewPiece()) {
        game.gameInterval = setInterval(() => game.moveDown(), game.speed);
    }
}

function stopGameMusic() {
    const gameMusic = document.getElementById('gameMusic');
    gameMusic.pause();
    gameMusic.currentTime = 0;
}
