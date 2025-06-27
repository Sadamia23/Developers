import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { AuthService } from '../../services/auth';
import { BugChaseService } from '../../services/bug-chase';
import { TechnologyStack, ExperienceLevel, ZodiacSign } from '../../types/enums/enums';
import { 
  GameState, 
  GameObject, 
  GameObjectType, 
  GameEffect, 
  GameStats, 
  GameControls,
  BugChaseDashboardDto,
  BugChaseGameResultDto,
  BugChaseLeaderboardEntryDto,
  BugChaseStatsDto 
} from '../../types/dtos/bug-chase-dtos';

@Component({
  selector: 'app-bug-chase',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './bug-chase.html',
  styleUrl: './bug-chase.css'
})
export class BugChaseComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  authService = inject(AuthService);
  bugChaseService = inject(BugChaseService);
  router = inject(Router);

  // Game state
  private ctx!: CanvasRenderingContext2D;
  private gameLoop!: number;
  private keys: GameControls = { up: false, down: false, jump: false, duck: false };
  
  // Game constants
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 400;
  private readonly GROUND_HEIGHT = 100;
  private readonly PLAYER_SIZE = 40;
  private readonly OBSTACLE_WIDTH = 30;
  private readonly OBSTACLE_HEIGHT = 40;
  private readonly POWERUP_SIZE = 25;
  private readonly GRAVITY = 0.8;
  private readonly JUMP_FORCE = -15;
  
  // Game state
  gameState = signal<GameState>({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    distance: 0,
    speed: 5,
    startTime: new Date(),
    obstacles: [],
    powerUps: [],
    player: {
      x: 100,
      y: this.CANVAS_HEIGHT - this.GROUND_HEIGHT - this.PLAYER_SIZE,
      width: this.PLAYER_SIZE,
      height: this.PLAYER_SIZE,
      type: GameObjectType.Player,
      emoji: '🏃‍♂️‍➡️',
      speed: 0
    },
    effects: []
  });

  // Game statistics
  gameStats = signal<GameStats>({
    bugsAvoided: 0,
    deadlinesAvoided: 0,
    meetingsAvoided: 0,
    coffeeCollected: 0,
    weekendsCollected: 0
  });

  // UI state
  dashboard = signal<BugChaseDashboardDto | null>(null);
  gameResult = signal<BugChaseGameResultDto | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showResult = signal<boolean>(false);
  activeTab = signal<'game' | 'stats' | 'leaderboard'>('game');

  // Timers
  private lastObstacleSpawn = 0;
  private lastPowerUpSpawn = 0;
  private lastSpeedIncrease = 0;

  async ngOnInit() {
    console.log('🏃 Bug Chase Component: Starting initialization...');
    
    try {
      this.isLoading.set(true);
      
      // Wait for auth
      await this.authService.waitForAuthInit();
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/login']);
        return;
      }

      // Initialize user stats and load dashboard
      await this.bugChaseService.initializeUserStats();
      await this.loadDashboard();
      
    } catch (error: any) {
      console.error('❌ Failed to initialize bug chase auth/data:', error);
      this.errorMessage.set(error.message || 'Failed to initialize game data');
    } finally {
      this.isLoading.set(false);
    }
  }

ngAfterViewInit() {
  console.log('🏃 Bug Chase Component: Initializing canvas...');
  
  try {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      this.initializeCanvasAndGame();
    }, 100);
    
  } catch (error: any) {
    console.error('❌ Failed to initialize canvas:', error);
    this.errorMessage.set('Failed to initialize game canvas');
  }
}

  ngOnDestroy() {
    this.cleanup();
  }

  private async initializeGame() {
    try {
      this.isLoading.set(true);
      
      // Wait for auth
      await this.authService.waitForAuthInit();
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/login']);
        return;
      }

      // Initialize canvas
      this.initializeCanvas();
      
      // Initialize user stats
      await this.bugChaseService.initializeUserStats();
      
      // Load dashboard
      await this.loadDashboard();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start render loop
      this.startRenderLoop();
      
    } catch (error: any) {
      console.error('❌ Failed to initialize bug chase:', error);
      this.errorMessage.set(error.message || 'Failed to initialize game');
    } finally {
      this.isLoading.set(false);
    }
  }

  private initializeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;
    
    // Set canvas styles
    canvas.style.border = '2px solid #8b5cf6';
    canvas.style.borderRadius = '12px';
    canvas.style.background = 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)';
  }
  private cleanup() {
  if (this.gameLoop) {
    cancelAnimationFrame(this.gameLoop);
  }
  
  // Clean up event listeners
  this.cleanupEventListeners();
}

private setupEventListeners() {
  // Clean up first to prevent duplicates
  this.cleanupEventListeners();
  
  // Add new event listeners
  document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  
  // Focus canvas for keyboard events
  const canvas = this.canvasRef?.nativeElement;
  if (canvas) {
    canvas.tabIndex = 0;
    canvas.focus();
  }
}

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        event.preventDefault();
        this.keys.jump = true;
        this.keys.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        event.preventDefault();
        this.keys.duck = true;
        this.keys.down = true;
        break;
      case 'KeyP':
        event.preventDefault();
        this.togglePause();
        break;
      case 'KeyR':
        if (this.gameState().isGameOver) {
          event.preventDefault();
          this.resetGame();
        }
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        this.keys.jump = false;
        this.keys.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.duck = false;
        this.keys.down = false;
        break;
    }
  }

  private startRenderLoop() {
    const animate = () => {
      this.update();
      this.render();
      this.gameLoop = requestAnimationFrame(animate);
    };
    this.gameLoop = requestAnimationFrame(animate);
  }

  private update() {
    const state = this.gameState();
    if (!state.isPlaying || state.isPaused || state.isGameOver) return;

    const now = Date.now();
    
    // Update player
    this.updatePlayer();
    
    // Spawn obstacles
    if (now - this.lastObstacleSpawn > 1500 - (state.speed * 20)) {
      this.spawnObstacle();
      this.lastObstacleSpawn = now;
    }
    
    // Spawn power-ups
    if (now - this.lastPowerUpSpawn > 5000 + Math.random() * 10000) {
      this.spawnPowerUp();
      this.lastPowerUpSpawn = now;
    }
    
    // Update obstacles
    this.updateObstacles();
    
    // Update power-ups
    this.updatePowerUps();
    
    // Update effects
    this.updateEffects();
    
    // Update game stats
    this.updateGameStats();
    
    // Increase speed over time
    if (now - this.lastSpeedIncrease > 10000) {
      state.speed = Math.min(state.speed + 0.5, 15);
      this.lastSpeedIncrease = now;
      this.gameState.set({ ...state });
    }
  }

 private updatePlayer() {
  const state = this.gameState();
  const player = state.player;
  
  // Apply gravity
  player.speed! += this.GRAVITY;
  
  // Handle jumping
  if (this.keys.jump && player.y >= this.CANVAS_HEIGHT - this.GROUND_HEIGHT - player.height) {
    player.speed = this.JUMP_FORCE;
    this.keys.jump = false;
  }
  
  // Update position
  player.y += player.speed!;
  
  // Ground collision
  const groundY = this.CANVAS_HEIGHT - this.GROUND_HEIGHT - player.height;
  if (player.y >= groundY) {
    player.y = groundY;
    player.speed = 0;
  }
  
  // Improved ducking mechanics
  if (this.keys.duck && player.y >= groundY) {
    // Duck more significantly and adjust position
    player.height = this.PLAYER_SIZE * 0.5; // Even lower duck
    player.y = this.CANVAS_HEIGHT - this.GROUND_HEIGHT - player.height; // Adjust position to ground
    player.emoji = '🤸‍♂️';
  } else {
    // Return to normal size and position
    const oldHeight = player.height;
    player.height = this.PLAYER_SIZE;
    
    // If we were ducking and now standing up, adjust position smoothly
    if (oldHeight < this.PLAYER_SIZE && player.y >= groundY) {
      player.y = groundY;
    }
    
    // Change emoji based on state
    if (player.y < groundY - 5) {
      player.emoji = '🦘'; // Jumping emoji
    } else {
      player.emoji = '🧍'; // Running emoji
    }
  }
  
  this.gameState.set({ ...state });
}

  private spawnObstacle() {
  const state = this.gameState();
  const obstacleTypes = [
    { type: GameObjectType.Bug, emoji: '🐛', color: '#ef4444' },
    { type: GameObjectType.Deadline, emoji: '⏰', color: '#f59e0b' },
    { type: GameObjectType.Meeting, emoji: '📅', color: '#8b5cf6' }
  ];
  
  const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  
  // Three height levels for obstacles
  const heightType = Math.random();
  let obstacleY: number;
  let obstacleDescription: string;
  
  if (heightType < 0.4) {
    // Ground level obstacles (40% chance) - normal running
    obstacleY = this.CANVAS_HEIGHT - this.GROUND_HEIGHT - this.OBSTACLE_HEIGHT;
    obstacleDescription = 'ground';
  } else if (heightType < 0.75) {
    // Middle level obstacles (35% chance) - requires ducking
    // Positioned so standing player hits them, but ducking player clears them
    obstacleY = this.CANVAS_HEIGHT - this.GROUND_HEIGHT - this.OBSTACLE_HEIGHT - 25;
    obstacleDescription = 'middle';
  } else {
    // High level obstacles (25% chance) - requires jumping
    // Positioned higher so player must jump to clear them
    obstacleY = this.CANVAS_HEIGHT - this.GROUND_HEIGHT - this.OBSTACLE_HEIGHT - 80;
    obstacleDescription = 'high';
  }
  
  const obstacle: GameObject = {
    x: this.CANVAS_WIDTH,
    y: obstacleY,
    width: this.OBSTACLE_WIDTH,
    height: this.OBSTACLE_HEIGHT,
    type: randomType.type,
    emoji: randomType.emoji,
    color: randomType.color,
    speed: state.speed
  };
  
  // Add obstacle to state
  state.obstacles.push(obstacle);
  this.gameState.set({ ...state });
  
  // Debug log to help with positioning (remove in production)
  console.log(`Spawned ${obstacleDescription} obstacle at y=${obstacleY}`);
}

  private spawnPowerUp() {
    const state = this.gameState();
    const powerUpTypes = [
      { type: GameObjectType.Coffee, emoji: '☕', color: '#a855f7' },
      { type: GameObjectType.Weekend, emoji: '🏖️', color: '#22c55e' }
    ];
    
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const powerUp: GameObject = {
      x: this.CANVAS_WIDTH,
      y: this.CANVAS_HEIGHT - this.GROUND_HEIGHT - this.POWERUP_SIZE - 20,
      width: this.POWERUP_SIZE,
      height: this.POWERUP_SIZE,
      type: randomType.type,
      emoji: randomType.emoji,
      color: randomType.color,
      speed: state.speed
    };
    
    state.powerUps.push(powerUp);
    this.gameState.set({ ...state });
  }

  private updateObstacles() {
    const state = this.gameState();
    
    // Move obstacles
    state.obstacles = state.obstacles.map(obstacle => ({
      ...obstacle,
      x: obstacle.x - obstacle.speed!
    }));
    
    // Check collisions
    const player = state.player;
    const hasInvincibility = state.effects.some(e => e.type === 'invincible' && e.active);
    
    if (!hasInvincibility) {
      for (const obstacle of state.obstacles) {
        if (this.checkCollision(player, obstacle)) {
          this.gameOver();
          return;
        }
      }
    }
    
    // Remove obstacles that are off-screen and count avoided
    const initialCount = state.obstacles.length;
    state.obstacles = state.obstacles.filter(obstacle => {
      if (obstacle.x + obstacle.width < 0) {
        // Count as avoided
        const stats = this.gameStats();
        switch (obstacle.type) {
          case GameObjectType.Bug:
            stats.bugsAvoided++;
            break;
          case GameObjectType.Deadline:
            stats.deadlinesAvoided++;
            break;
          case GameObjectType.Meeting:
            stats.meetingsAvoided++;
            break;
        }
        this.gameStats.set({ ...stats });
        return false;
      }
      return true;
    });
    
    this.gameState.set({ ...state });
  }

  private updatePowerUps() {
    const state = this.gameState();
    const player = state.player;
    
    // Move power-ups
    state.powerUps = state.powerUps.map(powerUp => ({
      ...powerUp,
      x: powerUp.x - powerUp.speed!
    }));
    
    // Check collisions
    const stats = this.gameStats();
    state.powerUps = state.powerUps.filter(powerUp => {
      if (this.checkCollision(player, powerUp)) {
        // Apply power-up effect
        switch (powerUp.type) {
          case GameObjectType.Coffee:
            this.applySpeedBoost();
            stats.coffeeCollected++;
            break;
          case GameObjectType.Weekend:
            this.applyInvincibility();
            stats.weekendsCollected++;
            break;
        }
        this.gameStats.set({ ...stats });
        return false;
      }
      return powerUp.x + powerUp.width > 0;
    });
    
    this.gameState.set({ ...state });
  }

  private updateEffects() {
    const state = this.gameState();
    const now = new Date();
    
    state.effects = state.effects.map(effect => ({
      ...effect,
      active: now.getTime() - effect.startTime.getTime() < effect.duration
    }));
    
    // Remove expired effects
    state.effects = state.effects.filter(effect => effect.active);
    
    this.gameState.set({ ...state });
  }

  private updateGameStats() {
    const state = this.gameState();
    const now = new Date();
    const timePlayed = (now.getTime() - state.startTime.getTime()) / 1000;
    
    state.distance = Math.floor(timePlayed * state.speed * 10);
    state.score = state.distance + (this.gameStats().bugsAvoided * 10) + 
                   (this.gameStats().deadlinesAvoided * 15) + 
                   (this.gameStats().meetingsAvoided * 20) +
                   (this.gameStats().coffeeCollected * 25) +
                   (this.gameStats().weekendsCollected * 30);
    
    this.gameState.set({ ...state });
  }

  private applySpeedBoost() {
    const state = this.gameState();
    const effect: GameEffect = {
      type: 'speed',
      startTime: new Date(),
      duration: 5000,
      active: true
    };
    
    state.effects.push(effect);
    state.speed = Math.min(state.speed * 1.5, 20);
    this.gameState.set({ ...state });
  }

  private applyInvincibility() {
    const state = this.gameState();
    const effect: GameEffect = {
      type: 'invincible',
      startTime: new Date(),
      duration: 3000,
      active: true
    };
    
    state.effects.push(effect);
    this.gameState.set({ ...state });
  }

  private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }

private render() {
  // FIXED: Use clearRect() to completely clear the canvas (no trails)
  this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
  
  // FIXED: Then fill with solid background color
  this.ctx.fillStyle = '#0f0f23'; // Solid background, no transparency
  this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
  
  const state = this.gameState();
  
  // FIXED: Draw ground with correct parameters (x, y, width, height)
  this.ctx.fillStyle = '#4a5568';
  this.ctx.fillRect(0, this.CANVAS_HEIGHT - this.GROUND_HEIGHT, this.CANVAS_WIDTH, this.GROUND_HEIGHT);
  
  // Draw player
  this.drawGameObject(state.player);
  
  // Draw obstacles
  state.obstacles.forEach(obstacle => this.drawGameObject(obstacle));
  
  // Draw power-ups
  state.powerUps.forEach(powerUp => this.drawGameObject(powerUp));
  
  // Draw effects overlay
  this.drawEffects();
  
  // Draw UI
  this.drawUI();
}

// FIXED: Updated drawGameObject to show only emojis (no background colors)
private drawGameObject(obj: GameObject) {
  // Save the current context state
  this.ctx.save();
  
  // REMOVED: Background color drawing - now showing only emojis
  // No more colored rectangles behind obstacles and power-ups
  
  // Draw emoji only
  if (obj.emoji) {
    this.ctx.font = `${obj.width * 0.8}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(obj.emoji, obj.x + obj.width / 2, obj.y + obj.height * 0.8);
  }
  
  // Restore the context state
  this.ctx.restore();
}

// OPTIONAL: Update drawEffects to ensure clean overlay rendering
private drawEffects() {
  const state = this.gameState();
  const hasInvincibility = state.effects.some(e => e.type === 'invincible' && e.active);
  
  if (hasInvincibility) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    this.ctx.restore();
  }
}
private ensureGameCanvasInitialized() {
  try {
    // Check if canvas exists and is properly initialized
    if (!this.canvasRef?.nativeElement || !this.ctx) {
      console.log('🔄 Reinitializing game canvas after tab switch...');
      this.initializeCanvasAndGame();
    } else {
      // Canvas exists, but make sure it's properly configured
      const canvas = this.canvasRef.nativeElement;
      if (canvas.width !== this.CANVAS_WIDTH || canvas.height !== this.CANVAS_HEIGHT) {
        console.log('🔄 Reconfiguring canvas dimensions...');
        this.initializeCanvas();
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring canvas initialization:', error);
    // Force full reinitialization
    setTimeout(() => {
      this.initializeCanvasAndGame();
    }, 50);
  }
}
private initializeCanvasAndGame() {
  try {
    if (!this.canvasRef?.nativeElement) {
      console.log('⏳ Canvas not ready, retrying...');
      setTimeout(() => {
        this.initializeCanvasAndGame();
      }, 100);
      return;
    }

    // Initialize canvas
    this.initializeCanvas();
    
    // Setup event listeners (clean up old ones first)
    this.cleanupEventListeners();
    this.setupEventListeners();
    
    // Ensure render loop is running
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    this.startRenderLoop();
    
    console.log('✅ Game canvas fully reinitialized');
  } catch (error) {
    console.error('❌ Failed to initialize canvas and game:', error);
  }
}

  private drawUI() {
    const state = this.gameState();
    
    // Draw score
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${state.score}`, 20, 40);
    this.ctx.fillText(`Distance: ${state.distance}m`, 20, 70);
    
    // Draw effects
    let effectY = 100;
    state.effects.forEach(effect => {
      if (effect.active) {
        const timeLeft = Math.max(0, effect.duration - (new Date().getTime() - effect.startTime.getTime()));
        const seconds = Math.ceil(timeLeft / 1000);
        const effectName = effect.type === 'speed' ? '⚡ Speed' : '🛡️ Shield';
        this.ctx.fillText(`${effectName}: ${seconds}s`, 20, effectY);
        effectY += 25;
      }
    });
    
    // Draw instructions
    if (!state.isPlaying) {
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#a1a1aa';
      this.ctx.fillText('Press SPACE to start', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
      this.ctx.fillText('↑/SPACE: Jump  ↓: Duck  P: Pause', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 30);
    }
  }

  // Game control methods
startGame() {
  // Ensure canvas is ready before starting
  this.ensureGameCanvasInitialized();
  
  const state = this.gameState();
  if (!state.isPlaying && !state.isGameOver) {
    state.isPlaying = true;
    state.startTime = new Date();
    this.gameState.set({ ...state });
    
    // Focus canvas for keyboard input
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.focus();
    }
  }
}

  togglePause() {
    const state = this.gameState();
    if (state.isPlaying && !state.isGameOver) {
      state.isPaused = !state.isPaused;
      this.gameState.set({ ...state });
    }
  }

  resetGame() {
    // Reset game state
    this.gameState.set({
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      distance: 0,
      speed: 5,
      startTime: new Date(),
      obstacles: [],
      powerUps: [],
      player: {
        x: 100,
        y: this.CANVAS_HEIGHT - this.GROUND_HEIGHT - this.PLAYER_SIZE,
        width: this.PLAYER_SIZE,
        height: this.PLAYER_SIZE,
        type: GameObjectType.Player,
        emoji: '🧍',
        speed: 0
      },
      effects: []
    });
    
    // Reset game stats
    this.gameStats.set({
      bugsAvoided: 0,
      deadlinesAvoided: 0,
      meetingsAvoided: 0,
      coffeeCollected: 0,
      weekendsCollected: 0
    });
    
    // Reset UI state
    this.showResult.set(false);
    this.gameResult.set(null);
    this.errorMessage.set(null);
    
    // Reset timers
    this.lastObstacleSpawn = 0;
    this.lastPowerUpSpawn = 0;
    this.lastSpeedIncrease = 0;

    setTimeout(() => {
  this.ensureGameCanvasInitialized();
}, 50);
  }

  private async gameOver() {
    const state = this.gameState();
    state.isGameOver = true;
    state.endTime = new Date();
    this.gameState.set({ ...state });
    
    // Submit score
    await this.submitScore();
  }

  private async submitScore() {
    try {
      this.isLoading.set(true);
      
      const state = this.gameState();
      const stats = this.gameStats();
      const survivalTime = ((state.endTime?.getTime() || Date.now()) - state.startTime.getTime()) / 1000;
      
      const scoreDto = {
        score: state.score,
        distance: state.distance,
        survivalTime: this.bugChaseService.formatSurvivalTime(survivalTime),
        bugsAvoided: stats.bugsAvoided,
        deadlinesAvoided: stats.deadlinesAvoided,
        meetingsAvoided: stats.meetingsAvoided,
        coffeeCollected: stats.coffeeCollected,
        weekendsCollected: stats.weekendsCollected
      };
      
      const result = await this.bugChaseService.submitScore(scoreDto);
      this.gameResult.set(result);
      this.showResult.set(true);
      
      // Reload dashboard
      await this.loadDashboard();
      
    } catch (error: any) {
      console.error('Failed to submit score:', error);
      this.errorMessage.set(error.message || 'Failed to submit score');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Data loading methods
  private async loadDashboard() {
    try {
      const dashboard = await this.bugChaseService.getDashboard();
      this.dashboard.set(dashboard);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      this.errorMessage.set(error.message || 'Failed to load dashboard');
    }
  }

  // UI helper methods
setActiveTab(tab: 'game' | 'stats' | 'leaderboard') {
  const previousTab = this.activeTab();
  this.activeTab.set(tab);
  
  // If switching TO the game tab, ensure canvas is properly initialized
  if (tab === 'game' && previousTab !== 'game') {
    // Use setTimeout to ensure the DOM is updated first
    setTimeout(() => {
      this.ensureGameCanvasInitialized();
    }, 100);
  }
}

  formatSurvivalTime(timeSpanString: string): string {
  return this.bugChaseService.parseTimeSpanToDisplay(timeSpanString);
  }

  getTechnologyStackName(techStack: TechnologyStack): string {
    return TechnologyStack[techStack] || 'Unknown';
  }

  getZodiacEmoji(zodiacSign: ZodiacSign): string {
    const zodiacEmojis: Record<ZodiacSign, string> = {
      [ZodiacSign.Aries]: '♈',
      [ZodiacSign.Taurus]: '♉',
      [ZodiacSign.Gemini]: '♊',
      [ZodiacSign.Cancer]: '♋',
      [ZodiacSign.Leo]: '♌',
      [ZodiacSign.Virgo]: '♍',
      [ZodiacSign.Libra]: '♎',
      [ZodiacSign.Scorpio]: '♏',
      [ZodiacSign.Sagittarius]: '♐',
      [ZodiacSign.Capricorn]: '♑',
      [ZodiacSign.Aquarius]: '♒',
      [ZodiacSign.Pisces]: '♓'
    };
    return zodiacEmojis[zodiacSign] || '⭐';
  }

  formatDate(dateString: Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRankEmoji(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  }

private cleanupEventListeners() {
  // Remove existing event listeners to prevent duplicates
  document.removeEventListener('keydown', this.handleKeyDown);
  document.removeEventListener('keyup', this.handleKeyUp);
}
}