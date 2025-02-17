class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('overlay');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game settings
        this.gridSize = 20;
        this.tileCount = 20;
        this.tileSize = this.canvas.width / this.tileCount;

        // Game state
        this.snake = [];
        this.foods = []; // Array for multiple food items
        this.purpleApples = []; // Array for multiple purple apples
        this.goldenApple = null;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.score = 0;
        this.lives = 3;
        this.redApplesEaten = 0;
        this.gameLoop = null;
        this.isGameRunning = false;

        // Rankings
        this.rankings = JSON.parse(localStorage.getItem('snakeRankings')) || [
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 }
        ];

        // Initialize ranking display
        const rankItems = document.querySelectorAll('.rank-item');
        this.rankings.forEach((rank, index) => {
            if (rankItems[index]) {
                rankItems[index].querySelector('.wallet').textContent = rank.wallet;
                rankItems[index].querySelector('.score').textContent = rank.score;
            }
        });

        // Animation properties
        this.foodScale = 1;
        this.snakeColors = ['#00ff88', '#00ff77', '#00ff66'];

        this.setupEventListeners();
        this.initializeBoard();
    }

    resizeCanvas() {
        const isMobile = window.innerWidth <= 900;
        const size = isMobile 
            ? Math.min(window.innerWidth * 0.95, window.innerHeight * 0.4)
            : Math.min(window.innerWidth * 0.8, window.innerHeight * 0.6);
        this.canvas.width = size;
        this.canvas.height = size;
        this.tileSize = this.canvas.width / this.tileCount;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Button controls
        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach(button => {
            button.addEventListener('click', () => {
                const key = button.getAttribute('data-key');
                this.handleKeyPress({ code: key });
            });
            
            // Add touch events for mobile
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const key = button.getAttribute('data-key');
                this.handleKeyPress({ code: key });
            });
        });

        // Start game button
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });

        // Touch swipe controls
        let touchStartX = null;
        let touchStartY = null;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, false);

        this.canvas.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY || !this.isGameRunning) return;

            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Minimum swipe distance to trigger direction change
            const minSwipeDistance = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0 && this.direction.x === 0) {
                        this.nextDirection = { x: 1, y: 0 };
                    } else if (deltaX < 0 && this.direction.x === 0) {
                        this.nextDirection = { x: -1, y: 0 };
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0 && this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: 1 };
                    } else if (deltaY < 0 && this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: -1 };
                    }
                }
            }

            touchStartX = touchEndX;
            touchStartY = touchEndY;
        }, false);

        this.canvas.addEventListener('touchend', () => {
            touchStartX = null;
            touchStartY = null;
        }, false);
    }

    handleKeyPress(e) {
        if (!this.isGameRunning) return;

        switch (e.code) {
            case 'KeyW':
                if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
                break;
            case 'KeyS':
                if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
                break;
            case 'KeyA':
                if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
                break;
            case 'KeyD':
                if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
                break;
        }
    }

    initializeBoard() {
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        this.foods = [];
        this.spawnFood(); // Spawn initial food
        this.purpleApples = [];
        this.goldenApple = null;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.lives = 3;
        this.redApplesEaten = 0;
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
    }

    startGame() {
        this.isGameRunning = true;
        this.overlay.style.display = 'none';
        this.initializeBoard();
        this.gameLoop = setInterval(() => this.update(), 100);
        
        // Start game music
        const gameMusic = document.getElementById('gameMusic');
        gameMusic.volume = 0.12; // Set volume to 12%
        gameMusic.currentTime = 0;
        gameMusic.play();
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
            localStorage.setItem('snakeRankings', JSON.stringify(this.rankings));
            
            // Update ranking display
            const rankItems = document.querySelectorAll('.rank-item');
            this.rankings.forEach((rank, index) => {
                if (rankItems[index]) {
                    rankItems[index].querySelector('.wallet').textContent = rank.wallet;
                    rankItems[index].querySelector('.score').textContent = rank.score;
                }
            });
        }
    }

    endGame() {
        this.isGameRunning = false;
        clearInterval(this.gameLoop);
        this.updateRankings();
        this.overlay.style.display = 'flex';
        document.querySelector('.menu h1').textContent = 'GAME OVER';
        document.getElementById('startGame').textContent = 'Play Again';
    }

    update() {
        this.direction = this.nextDirection;
        const head = { 
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y 
        };

        if (head.x < 0 || head.x >= this.tileCount || 
            head.y < 0 || head.y >= this.tileCount ||
            this.isCollisionWithSnake(head)) {
            
            this.lives--;
            document.getElementById('lives').textContent = this.lives;
            
            // Play dead sound and stop game music
            const gameMusic = document.getElementById('gameMusic');
            deadSound.volume = 0.12; // Set volume to 12%
            gameMusic.pause();
            deadSound.currentTime = 0;
            deadSound.play();

            if (this.lives <= 0) {
                this.endGame();
                return;
            }
            
            // Show continue overlay
            clearInterval(this.gameLoop);
            const continueOverlay = document.getElementById('continueOverlay');
            continueOverlay.style.display = 'flex';
            
            // Add continue button listener
            const continueButton = document.getElementById('continueGame');
            const continueHandler = () => {
                continueOverlay.style.display = 'none';
                // Reset snake position but keep score
                this.snake = [
                    { x: 10, y: 10 },
                    { x: 9, y: 10 },
                    { x: 8, y: 10 }
                ];
                this.direction = { x: 1, y: 0 };
                this.nextDirection = { x: 1, y: 0 };
                
                // Restart game music
                const gameMusic = document.getElementById('gameMusic');
                gameMusic.currentTime = 0;
                gameMusic.play();
                
                this.gameLoop = setInterval(() => this.update(), 100);
                
                // Remove event listener
                continueButton.removeEventListener('click', continueHandler);
            };
            
            continueButton.addEventListener('click', continueHandler);
            return;
        }

        this.snake.unshift(head);

        let ate = false;
        // Check collision with regular food
        for (let i = this.foods.length - 1; i >= 0; i--) {
            if (head.x === this.foods[i].x && head.y === this.foods[i].y) {
                this.score += 10;
                this.redApplesEaten++;
                ate = true;
                this.foods.splice(i, 1);
                
                // Spawn new food
                this.spawnFood();

                // After 20 red apples, spawn 2 bonus apples
                if (this.redApplesEaten === 20) {
                    for (let j = 0; j < 2; j++) {
                        this.spawnFood();
                    }
                }

                // Check for special apples every 5 apples
                if (this.redApplesEaten % 5 === 0) {
                    if (!this.goldenApple) this.spawnGoldenApple();
                    
                    // Spawn purple apples based on score
                    if (this.score >= 100) {
                        // Spawn 2 purple apples when score >= 100
                        while (this.purpleApples.length < 2) {
                            this.spawnPurpleApple();
                        }
                    } else {
                        // Spawn 1 purple apple when score < 100
                        if (this.purpleApples.length === 0) {
                            this.spawnPurpleApple();
                        }
                    }
                }
                break;
            }
        }

        // Check collision with special apples
        if (!ate) {
            // Check golden apple collision
            if (this.goldenApple && head.x === this.goldenApple.x && head.y === this.goldenApple.y) {
                this.score += 50;
                ate = true;
                this.goldenApple = null;
            }
            
            // Check purple apples collision
            for (let i = this.purpleApples.length - 1; i >= 0; i--) {
                if (head.x === this.purpleApples[i].x && head.y === this.purpleApples[i].y) {
                    this.score = Math.floor(this.score / 2);
                    ate = true;
                    this.purpleApples.splice(i, 1);
                    break;
                }
            }
        }

        if (!ate) {
            this.snake.pop();
        }

        document.getElementById('score').textContent = this.score;
        this.foodScale = 0.8 + Math.sin(Date.now() / 200) * 0.2;
        this.draw();
    }

    spawnFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * (this.tileCount - 2)) + 1,
                y: Math.floor(Math.random() * (this.tileCount - 2)) + 1
            };
        } while (
            this.isCollisionWithSnake(newFood) ||
            this.isCollisionWithAnyFood(newFood) ||
            this.isCollisionWithAnyPurpleApple(newFood) ||
            (this.goldenApple && newFood.x === this.goldenApple.x && newFood.y === this.goldenApple.y)
        );
        
        // Add the food
        this.foods.push(newFood);
        
        // Only start disappearing food after 20 red apples eaten
        if (this.redApplesEaten >= 20) {
            setTimeout(() => {
                const index = this.foods.findIndex(f => f.x === newFood.x && f.y === newFood.y);
                if (index !== -1) {
                    this.foods.splice(index, 1);
                    // Spawn a new food to replace the removed one
                    this.spawnFood();
                }
            }, 10000);
        }
    }

    spawnPurpleApple() {
        let newPurpleApple;
        do {
            newPurpleApple = {
                x: Math.floor(Math.random() * (this.tileCount - 2)) + 1,
                y: Math.floor(Math.random() * (this.tileCount - 2)) + 1
            };
        } while (
            this.isCollisionWithSnake(newPurpleApple) ||
            this.isCollisionWithAnyFood(newPurpleApple) ||
            this.isCollisionWithAnyPurpleApple(newPurpleApple) ||
            (this.goldenApple && newPurpleApple.x === this.goldenApple.x && newPurpleApple.y === this.goldenApple.y)
        );

        this.purpleApples.push(newPurpleApple);

        setTimeout(() => {
            const index = this.purpleApples.findIndex(p => p.x === newPurpleApple.x && p.y === newPurpleApple.y);
            if (index !== -1) {
                this.purpleApples.splice(index, 1);
            }
        }, Math.random() * (20000 - 10000) + 10000);
    }

    spawnGoldenApple() {
        if (this.goldenApple) return;

        do {
            this.goldenApple = {
                x: Math.floor(Math.random() * (this.tileCount - 2)) + 1,
                y: Math.floor(Math.random() * (this.tileCount - 2)) + 1
            };
        } while (
            this.isCollisionWithSnake(this.goldenApple) ||
            this.isCollisionWithAnyFood(this.goldenApple) ||
            this.isCollisionWithAnyPurpleApple(this.goldenApple)
        );

        setTimeout(() => {
            this.goldenApple = null;
        }, 10000);
    }

    isCollisionWithSnake(pos) {
        return this.snake.some(segment => segment.x === pos.x && segment.y === pos.y);
    }

    isCollisionWithAnyFood(pos) {
        return this.foods.some(food => food.x === pos.x && food.y === pos.y);
    }

    isCollisionWithAnyPurpleApple(pos) {
        return this.purpleApples.some(apple => apple.x === pos.x && apple.y === pos.y);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            const colorIndex = index % this.snakeColors.length;
            this.ctx.fillStyle = this.snakeColors[colorIndex];
            this.ctx.beginPath();
            this.ctx.roundRect(
                segment.x * this.tileSize + 1,
                segment.y * this.tileSize + 1,
                this.tileSize - 2,
                this.tileSize - 2,
                5
            );
            this.ctx.fill();
        });

        // Draw regular food
        const foodSize = this.tileSize * this.foodScale;
        const foodOffset = (this.tileSize - foodSize) / 2;
        
        this.foods.forEach(food => {
            this.ctx.fillStyle = '#ff3366';
            this.ctx.beginPath();
            this.ctx.roundRect(
                food.x * this.tileSize + foodOffset,
                food.y * this.tileSize + foodOffset,
                foodSize,
                foodSize,
                5
            );
            this.ctx.fill();
        });

        // Draw purple apples
        this.purpleApples.forEach(apple => {
            this.ctx.fillStyle = '#800080';
            const purpleAppleSize = this.tileSize * this.foodScale;
            const purpleAppleOffset = (this.tileSize - purpleAppleSize) / 2;
            
            this.ctx.beginPath();
            this.ctx.roundRect(
                apple.x * this.tileSize + purpleAppleOffset,
                apple.y * this.tileSize + purpleAppleOffset,
                purpleAppleSize,
                purpleAppleSize,
                5
            );
            this.ctx.fill();
        });

        // Draw golden apple if available
        if (this.goldenApple) {
            this.ctx.fillStyle = '#ffd700';
            const goldenAppleSize = this.tileSize * this.foodScale;
            const goldenAppleOffset = (this.tileSize - goldenAppleSize) / 2;
            
            // Add glow effect
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 15;
            
            this.ctx.beginPath();
            this.ctx.roundRect(
                this.goldenApple.x * this.tileSize + goldenAppleOffset,
                this.goldenApple.y * this.tileSize + goldenAppleOffset,
                goldenAppleSize,
                goldenAppleSize,
                5
            );
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        }
    }
}
