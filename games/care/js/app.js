// Check if device is mobile or tablet
function isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
    const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
    const isSmallScreen = window.innerWidth <= 900;
    const hasTouchScreen = navigator.maxTouchPoints > 0;
    
    return (isMobile || isTablet || (isSmallScreen && hasTouchScreen));
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show mobile overlay if on mobile device
    if (isMobileDevice()) {
        document.getElementById('mobileOverlay').style.display = 'flex';
        return;
    }

    // Initialize game
    const game = new PixelRacer();
    window.game = game;

    // Load and display high score
    const highScore = localStorage.getItem('highScore') || '0';
    document.getElementById('highScore').textContent = highScore;

    // Add visual feedback to control buttons
    document.querySelectorAll('.control-btn').forEach(button => {
        // Visual feedback
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
            button.style.background = '#C0392B';
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
            button.style.background = '#E74C3C';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.background = '#E74C3C';
        });
        
        // Control handling
        button.addEventListener('click', () => {
            if (!game.isGameRunning || !game.canMove || game.isPaused) return;
            const key = button.getAttribute('data-key');
            if (key === 'KeyA' && game.playerLane > 0) {
                game.playerLane--;
            } else if (key === 'KeyD' && game.playerLane < 5) {
                game.playerLane++;
            }
        });
    });

    // Handle window focus/blur for game music
    window.addEventListener('blur', () => {
        if (game.isGameRunning && !game.isPaused) {
            game.isPaused = true;
            if (game.gameMusic) {
                game.gameMusic.pause();
            }
        }
    });

    window.addEventListener('focus', () => {
        if (game.isGameRunning && game.isPaused && game.lives > 0) {
            game.isPaused = false;
            if (game.gameMusic) {
                game.gameMusic.play().catch(console.error);
            }
            game.update();
        }
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !game.isGameRunning) {
            // Start game with spacebar
            const startButton = document.getElementById('startGame');
            if (startButton && startButton.style.display !== 'none') {
                startButton.click();
            }
        }
    });

    // Update high score display
    function updateHighScore() {
        const highScore = localStorage.getItem('highScore') || '0';
        document.getElementById('highScore').textContent = highScore;
    }

    // Initial high score update
    updateHighScore();
});
