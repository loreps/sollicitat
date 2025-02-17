class PixelRacer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('overlay');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game settings
        this.laneCount = 6;
        this.laneWidth = this.canvas.width / this.laneCount;
        this.pixelSize = 4;
        this.carWidth = 21;  // Reduced by 20% from 26
        this.carHeight = 30;  // Reduced by 20% from 38
        this.speed = 5;
        
        // Traffic car colors
        this.trafficColors = [
            ['#FF0000', '#8B0000', '#000000'], // Red
            ['#00FF00', '#008000', '#000000'], // Green
            ['#0000FF', '#000080', '#000000'], // Blue
            ['#FF00FF', '#8B008B', '#000000'], // Purple
            ['#00FFFF', '#008B8B', '#000000'], // Cyan
            ['#FFA500', '#FF8C00', '#000000']  // Orange
        ];
        
        // Game state
        this.playerLane = 2;
        this.playerY = this.canvas.height - this.carHeight * this.pixelSize - 20;
        this.obstacles = [];
        this.score = 0;
        this.lives = 3;
        this.isGameRunning = false;
        this.isPaused = false;
        this.lastObstacleTime = 0;
        this.spawnInterval = 1000;
        this.canMove = true;

        // Audio setup
        this.gameMusic = document.getElementById('gameMusic');
        this.crashSound = document.getElementById('crashSound');
        
        // Initialize audio
        if (this.gameMusic) {
            this.gameMusic.volume = 0.12; // Set volume to 12%
            this.gameMusic.load();
            this.gameMusic.loop = true;
        }
        if (this.crashSound) {
            this.crashSound.volume = 0.12; // Set volume to 12%
            this.crashSound.load();
        }

        this.setupControls();
    }

    resizeCanvas() {
        const isMobile = window.innerWidth <= 900;
        const size = isMobile 
            ? Math.min(window.innerWidth * 0.95, window.innerHeight * 0.4)
            : Math.min(window.innerWidth * 0.8, window.innerHeight * 0.7);
        this.canvas.width = size;
        this.canvas.height = size * 1.2;
        this.laneWidth = this.canvas.width / this.laneCount;
        this.playerY = this.canvas.height - this.carHeight * this.pixelSize - 20;
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isGameRunning || !this.canMove || this.isPaused) return;
            
            if (e.code === 'KeyA' && this.playerLane > 0) {
                this.playerLane--;
            } else if (e.code === 'KeyD' && this.playerLane < 5) {
                this.playerLane++;
            }
        });

        const startButton = document.getElementById('startGame');
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }
    }

    getLaneCenter(lane) {
        return (lane * this.laneWidth + this.laneWidth / 2) - (this.carWidth * this.pixelSize) / 2;
    }

    drawPixelRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                this.ctx.fillRect(
                    x + i * this.pixelSize,
                    y + j * this.pixelSize,
                    this.pixelSize,
                    this.pixelSize
                );
            }
        }
    }

    drawCar(x, y, isPlayer, colorScheme = null) {
        const colors = isPlayer ? 
            ['#FFD700', '#FFA500', '#000000'] : // Player car colors
            (colorScheme || this.trafficColors[Math.floor(Math.random() * this.trafficColors.length)]);

        // Main body
        this.drawPixelRect(x, y, this.carWidth, this.carHeight, colors[0]);

        // Windows
        const windowWidth = Math.floor(this.carWidth * 0.6);
        const windowHeight = Math.floor(this.carHeight * 0.2);
        const windowX = x + (this.carWidth * this.pixelSize - windowWidth * this.pixelSize) / 2;
        const windowY = y + (isPlayer ? this.carHeight * 0.2 : this.carHeight * 0.6) * this.pixelSize;
        this.drawPixelRect(windowX, windowY, windowWidth, windowHeight, colors[2]);

        // Details
        this.drawPixelRect(x, y + this.carHeight * this.pixelSize * 0.3, 2, 6, colors[2]);
        this.drawPixelRect(x + (this.carWidth - 2) * this.pixelSize, y + this.carHeight * this.pixelSize * 0.3, 2, 6, colors[2]);
    }

    drawRoad() {
        // Road background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Lane markers
        for (let i = 1; i < this.laneCount; i++) {
            const x = i * this.laneWidth;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.setLineDash([20, 20]);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }

    spawnObstacle() {
        const count = Math.floor(Math.random() * 3) + 1;
        const usedLanes = new Set();

        for (let i = 0; i < count; i++) {
            let lane;
            do {
                lane = Math.floor(Math.random() * this.laneCount);
            } while (usedLanes.has(lane));

            usedLanes.add(lane);
            const colorScheme = this.trafficColors[Math.floor(Math.random() * this.trafficColors.length)];
            this.obstacles.push({
                x: this.getLaneCenter(lane),
                y: -this.carHeight * this.pixelSize,
                lane: lane,
                colorScheme: colorScheme
            });
        }
    }

    checkCollision(car1X, car1Y, car2X, car2Y) {
        const carSize = {
            width: this.carWidth * this.pixelSize,
            height: this.carHeight * this.pixelSize
        };

        return car1X < car2X + carSize.width &&
               car1X + carSize.width > car2X &&
               car1Y < car2Y + carSize.height &&
               car1Y + carSize.height > car2Y;
    }

    startGame() {
        this.isGameRunning = true;
        this.isPaused = false;
        this.overlay.style.display = 'none';
        this.score = 0;
        this.lives = 3;
        this.obstacles = [];
        this.playerLane = 2;
        this.speed = 5;
        this.canMove = true;
        
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;

        // Start game music
        if (this.gameMusic) {
            this.gameMusic.currentTime = 0;
            const playPromise = this.gameMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing game music:', error);
                });
            }
        }

        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.update();
    }

    handleCollision() {
        this.lives--;
        document.getElementById('lives').textContent = this.lives;
        this.isPaused = true;
        this.canMove = false;

        // Play crash sound and pause game music
        if (this.gameMusic && this.crashSound) {
            this.gameMusic.pause();
            this.crashSound.currentTime = 0;
            const playPromise = this.crashSound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing crash sound:', error);
                });
            }
        }

        if (this.lives <= 0) {
            this.endGame();
        } else {
            this.overlay.style.display = 'flex';
            const menu = this.overlay.querySelector('.menu');
            menu.innerHTML = `
                <h1>
                    <i class="fas fa-car-crash"></i>
                    CRASH!
                </h1>
                <p>Lives remaining: ${this.lives}</p>
                <button id="continueGame" class="btn">
                    <i class="fas fa-play"></i>
                    Continue
                </button>
            `;

            const continueButton = document.getElementById('continueGame');
            continueButton.addEventListener('click', () => this.continueGame(), { once: true });
        }
    }

    continueGame() {
        this.overlay.style.display = 'none';
        this.isPaused = false;
        this.canMove = true;
        this.obstacles = [];
        this.playerLane = 2;
        
        // Resume game music
        if (this.gameMusic) {
            this.gameMusic.currentTime = 0;
            const playPromise = this.gameMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error resuming game music:', error);
                });
            }
        }

        this.update();
    }

    endGame() {
        this.isGameRunning = false;
        
        // Stop game music and play crash sound
        if (this.gameMusic) {
            this.gameMusic.pause();
            this.gameMusic.currentTime = 0;
        }
        if (this.crashSound) {
            this.crashSound.currentTime = 0;
            const playPromise = this.crashSound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing crash sound:', error);
                });
            }
        }

        this.overlay.style.display = 'flex';
        const menu = this.overlay.querySelector('.menu');
        menu.innerHTML = `
            <h1>
                <i class="fas fa-flag-checkered"></i>
                GAME OVER
            </h1>
            <p>Final Score: ${this.score}</p>
            <button id="restartGame" class="btn">
                <i class="fas fa-redo"></i>
                Play Again
            </button>
            <div class="instructions">
                <p><i class="fas fa-keyboard"></i> Use A/D keys to move left/right</p>
                <p><i class="fas fa-car"></i> Dodge the oncoming traffic!</p>
                <p><i class="fas fa-heart"></i> You have 3 lives - drive carefully!</p>
            </div>
        `;

        const restartButton = document.getElementById('restartGame');
        restartButton.addEventListener('click', () => {
            this.startGame();
        }, { once: true });
    }

    update() {
        if (!this.isGameRunning || this.isPaused) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawRoad();

        const now = Date.now();
        if (now - this.lastObstacleTime > this.spawnInterval) {
            this.spawnObstacle();
            this.lastObstacleTime = now;
            this.spawnInterval = Math.max(500, 1000 - Math.floor(this.score / 100) * 50);
            this.speed = Math.min(15, 5 + Math.floor(this.score / 200));
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += this.speed;

            if (this.checkCollision(
                this.getLaneCenter(this.playerLane),
                this.playerY,
                obstacle.x,
                obstacle.y
            )) {
                this.handleCollision();
                this.obstacles.splice(i, 1);
                return;
            }

            if (obstacle.y > this.canvas.height) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                document.getElementById('score').textContent = this.score;
                continue;
            }

            this.drawCar(obstacle.x, obstacle.y, false, obstacle.colorScheme);
        }

        this.drawCar(this.getLaneCenter(this.playerLane), this.playerY, true);
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
}
