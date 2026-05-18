/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart, Play, RefreshCw, ChevronRight } from 'lucide-react';

// --- Constants & Config ---
const TILE_SIZE = 20;
const POWER_PELLET_DURATION = 10000; // 10 seconds
const GHOST_FRIGHTENED_COLOR = '#2121ff';
const GHOST_COLORS = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852']; // Blinky, Pinky, Inky, Clyde

enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4,
}

enum TileType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  POWER_PELLET = 3,
  GHOST_HOUSE = 4,
}

// --- Level Layouts ---
const LEVELS = [
  // Level 1: Classic-inspired
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  // Level 2: Diamond
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,1,1,1,2,2,2,2,2,2,3,1],
    [1,2,1,1,1,1,1,2,2,1,2,2,1,1,1,1,1,2,1],
    [1,2,1,2,2,2,1,1,2,2,2,1,1,2,2,2,1,2,1],
    [1,2,2,2,1,2,2,2,2,2,2,2,2,2,1,2,2,2,1],
    [1,1,2,1,1,1,2,1,1,1,1,1,2,1,1,1,2,1,1],
    [1,1,2,2,2,2,2,1,0,0,0,1,2,2,2,2,2,1,1],
    [1,1,2,1,1,1,2,1,0,4,0,1,2,1,1,1,2,1,1],
    [0,0,2,2,2,2,2,1,1,1,1,1,2,2,2,2,2,0,0],
    [1,1,2,1,1,1,2,2,2,2,2,2,2,1,1,1,2,1,1],
    [1,1,2,2,2,2,1,1,1,0,1,1,1,2,2,2,2,1,1],
    [1,1,1,1,1,2,1,1,1,0,1,1,1,2,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,2,1],
    [1,2,2,1,2,2,2,2,2,1,2,2,2,2,2,1,2,2,1],
    [1,3,2,1,2,1,1,1,2,1,2,1,1,1,2,1,2,3,1],
    [1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  // Level 3: Cross
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
    [1,2,1,1,1,1,2,1,2,1,2,1,2,1,1,1,1,2,1],
    [1,2,1,2,2,2,2,1,2,2,2,1,2,2,2,2,1,2,1],
    [1,2,1,2,1,1,2,1,1,1,1,1,2,1,1,2,1,2,1],
    [1,2,2,2,1,1,2,2,2,1,2,2,2,1,1,2,2,2,1],
    [1,1,1,2,1,1,1,1,0,1,0,1,1,1,1,2,1,1,1],
    [0,0,1,2,2,2,2,1,0,0,0,1,2,2,2,2,1,0,0],
    [1,1,1,1,1,1,2,1,1,4,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,0,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ]
];

// --- Classes ---

class Actor {
  x: number;
  y: number;
  radius: number;
  speed: number;
  dir: Direction;
  nextDir: Direction;

  constructor(x: number, y: number, radius: number, speed: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.dir = Direction.NONE;
    this.nextDir = Direction.NONE;
  }

  getCenterX() { return this.x + TILE_SIZE / 2; }
  getCenterY() { return this.y + TILE_SIZE / 2; }

  getMapX() { return Math.floor(this.getCenterX() / TILE_SIZE); }
  getMapY() { return Math.floor(this.getCenterY() / TILE_SIZE); }

  canMove(dir: Direction, maze: number[][]) {
    let nextX = this.getMapX();
    let nextY = this.getMapY();

    if (dir === Direction.UP) nextY--;
    if (dir === Direction.DOWN) nextY++;
    if (dir === Direction.LEFT) nextX--;
    if (dir === Direction.RIGHT) nextX++;

    if (nextY < 0 || nextY >= maze.length || nextX < 0 || nextX >= maze[0].length) return false;
    return maze[nextY][nextX] !== TileType.WALL && maze[nextY][nextX] !== TileType.GHOST_HOUSE;
  }

  update(maze: number[][]) {
    // Try to change direction at tile center
    const isAtCenter = (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0);
    
    if (isAtCenter) {
      if (this.nextDir !== Direction.NONE && this.canMove(this.nextDir, maze)) {
        this.dir = this.nextDir;
        this.nextDir = Direction.NONE;
      }
      
      if (!this.canMove(this.dir, maze)) {
        this.dir = Direction.NONE;
      }
    }

    if (this.dir === Direction.UP) this.y -= this.speed;
    if (this.dir === Direction.DOWN) this.y += this.speed;
    if (this.dir === Direction.LEFT) this.x -= this.speed;
    if (this.dir === Direction.RIGHT) this.x += this.speed;

    // Screen wrapping
    const mapWidth = maze[0].length * TILE_SIZE;
    if (this.x < 0) this.x = mapWidth - TILE_SIZE;
    if (this.x >= mapWidth) this.x = 0;
  }
}

class Player extends Actor {
  mouthOpen: number = 0;
  mouthSpeed: number = 0.15;

  constructor(x: number, y: number) {
    super(x, y, 8, 2);
  }

  draw(ctx: CanvasRenderingContext2D, frame: number) {
    this.mouthOpen = Math.abs(Math.sin(frame * this.mouthSpeed));
    const cx = this.getCenterX();
    const cy = this.getCenterY();

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    
    let rotation = 0;
    if (this.dir === Direction.RIGHT) rotation = 0;
    if (this.dir === Direction.DOWN) rotation = Math.PI / 2;
    if (this.dir === Direction.LEFT) rotation = Math.PI;
    if (this.dir === Direction.UP) rotation = -Math.PI / 2;

    const startAngle = rotation + this.mouthOpen * 0.2 * Math.PI;
    const endAngle = rotation + (2 - this.mouthOpen * 0.2) * Math.PI;

    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, this.radius, startAngle, endAngle);
    ctx.fill();

    // Ms. Pac-Man bow (simplified)
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - this.radius, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 2, cy - this.radius, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Ghost extends Actor {
  color: string;
  originalColor: string;
  isFrightened: boolean = false;
  frightenedTimer: number = 0;
  id: number;

  constructor(x: number, y: number, color: string, id: number) {
    super(x, y, 8, 1); // Ghosts are slightly slower than player
    this.color = color;
    this.originalColor = color;
    this.id = id;
  }

  updateGhost(maze: number[][], player: Player) {
    const isAtCenter = (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0);

    if (isAtCenter) {
      const possibleDirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]
        .filter(d => {
          // Don't reverse direction immediately unless blocked
          const opposite = {
            [Direction.UP]: Direction.DOWN,
            [Direction.DOWN]: Direction.UP,
            [Direction.LEFT]: Direction.RIGHT,
            [Direction.RIGHT]: Direction.LEFT,
            [Direction.NONE]: Direction.NONE,
          }[this.dir];
          return d !== opposite && this.canMove(d, maze);
        });

      if (possibleDirs.length > 0) {
        if (this.isFrightened) {
          // Random movement when frightened
          this.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        } else {
          // Basic tracking
          let targetX = player.getMapX();
          let targetY = player.getMapY();

          // Variations in behavior
          if (this.id === 1) { // Pinky intercepts
            if (player.dir === Direction.UP) targetY -= 4;
            if (player.dir === Direction.DOWN) targetY += 4;
            if (player.dir === Direction.LEFT) targetX -= 4;
            if (player.dir === Direction.RIGHT) targetX += 4;
          } else if (this.id === 3) { // Clyde is random
            if (Math.random() > 0.8) {
              this.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
              super.update(maze);
              return;
            }
          }

          // Pick direction that minimizes distance to target
          let bestDir = possibleDirs[0];
          let minDist = Infinity;

          possibleDirs.forEach(d => {
            let nextX = this.getMapX();
            let nextY = this.getMapY();
            if (d === Direction.UP) nextY--;
            if (d === Direction.DOWN) nextY++;
            if (d === Direction.LEFT) nextX--;
            if (d === Direction.RIGHT) nextX++;

            const dist = Math.sqrt(Math.pow(nextX - targetX, 2) + Math.pow(nextY - targetY, 2));
            if (dist < minDist) {
              minDist = dist;
              bestDir = d;
            }
          });
          this.dir = bestDir;
        }
      } else {
        // Reverse if blocked
        const opposite = {
          [Direction.UP]: Direction.DOWN,
          [Direction.DOWN]: Direction.UP,
          [Direction.LEFT]: Direction.RIGHT,
          [Direction.RIGHT]: Direction.LEFT,
          [Direction.NONE]: Direction.NONE,
        }[this.dir];
        this.dir = opposite as Direction;
      }
    }

    super.update(maze);
  }

  draw(ctx: CanvasRenderingContext2D, frame: number) {
    const cx = this.getCenterX();
    const cy = this.getCenterY();
    const color = this.isFrightened ? GHOST_FRIGHTENED_COLOR : this.color;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, this.radius, Math.PI, 0);
    ctx.lineTo(cx + this.radius, cy + this.radius);
    
    // Squiggly bottom
    const steps = 3;
    const wave = Math.sin(frame * 0.2) * 2;
    for (let i = 0; i <= steps; i++) {
        const xOffset = this.radius - (i * (this.radius * 2) / steps);
        ctx.lineTo(cx + xOffset, cy + this.radius + (i % 2 === 0 ? wave : -wave));
    }

    ctx.lineTo(cx - this.radius, cy + this.radius);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
    ctx.arc(cx + 3, cy - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0000ff';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 1, 0, Math.PI * 2);
    ctx.arc(cx + 3, cy - 3, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Main Component ---

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(0);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY' | 'LEVELUP'>('START');
  
  // Game State Refs (avoid re-renders during loop)
  const mazeRef = useRef<number[][]>([]);
  const playerRef = useRef<Player | null>(null);
  const ghostsRef = useRef<Ghost[]>([]);
  const frameRef = useRef(0);
  const animationIdRef = useRef<number>(0);
  const frightenedDurationRef = useRef(0);
  const dotsRemainingRef = useRef(0);

  const initLevel = useCallback((levelIdx: number) => {
    const layout = LEVELS[levelIdx % LEVELS.length];
    mazeRef.current = layout.map(row => [...row]);
    
    let dots = 0;
    layout.forEach(row => row.forEach(tile => {
      if (tile === TileType.DOT || tile === TileType.POWER_PELLET) dots++;
    }));
    dotsRemainingRef.current = dots;

    // Center spawn (roughly)
    const midX = Math.floor(layout[0].length / 2);
    const midY = 15;
    playerRef.current = new Player(midX * TILE_SIZE, midY * TILE_SIZE);

    ghostsRef.current = [
      new Ghost(8 * TILE_SIZE, 9 * TILE_SIZE, GHOST_COLORS[0], 0),
      new Ghost(9 * TILE_SIZE, 9 * TILE_SIZE, GHOST_COLORS[1], 1),
      new Ghost(10 * TILE_SIZE, 9 * TILE_SIZE, GHOST_COLORS[2], 2),
      new Ghost(9 * TILE_SIZE, 10 * TILE_SIZE, GHOST_COLORS[3], 3),
    ];
  }, []);

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setLevel(0);
    initLevel(0);
    setGameState('PLAYING');
  };

  const nextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    initLevel(nextLvl);
    setGameState('PLAYING');
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current) return;
      if (e.key === 'ArrowUp') playerRef.current.nextDir = Direction.UP;
      if (e.key === 'ArrowDown') playerRef.current.nextDir = Direction.DOWN;
      if (e.key === 'ArrowLeft') playerRef.current.nextDir = Direction.LEFT;
      if (e.key === 'ArrowRight') playerRef.current.nextDir = Direction.RIGHT;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const gameLoop = () => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameRef.current++;

    // --- Update ---
    const player = playerRef.current!;
    const maze = mazeRef.current;
    player.update(maze);

    // Collision with dots
    const mx = player.getMapX();
    const my = player.getMapY();
    if (maze[my][mx] === TileType.DOT) {
      maze[my][mx] = TileType.EMPTY;
      setScore(s => s + 10);
      dotsRemainingRef.current--;
    } else if (maze[my][mx] === TileType.POWER_PELLET) {
      maze[my][mx] = TileType.EMPTY;
      setScore(s => s + 50);
      dotsRemainingRef.current--;
      
      // Frighten ghosts
      frightenedDurationRef.current = POWER_PELLET_DURATION;
      ghostsRef.current.forEach(g => {
        g.isFrightened = true;
      });
    }

    if (frightenedDurationRef.current > 0) {
      frightenedDurationRef.current -= 16.67; // approx ms per frame
      if (frightenedDurationRef.current <= 0) {
        ghostsRef.current.forEach(g => g.isFrightened = false);
      }
    }

    // Victory check
    if (dotsRemainingRef.current === 0) {
       setGameState('LEVELUP');
       return;
    }

    // Ghost updates & collision
    ghostsRef.current.forEach(ghost => {
      ghost.updateGhost(maze, player);

      // Collision detection
      const dx = Math.abs(player.getCenterX() - ghost.getCenterX());
      const dy = Math.abs(player.getCenterY() - ghost.getCenterY());
      if (dx < 12 && dy < 12) {
        if (ghost.isFrightened) {
          // Eat ghost
          setScore(s => s + 200);
          ghost.x = 9 * TILE_SIZE;
          ghost.y = 9 * TILE_SIZE;
          ghost.isFrightened = false;
        } else {
          // Player hit
          setLives(l => {
            const nextL = l - 1;
            if (nextL <= 0) setGameState('GAMEOVER');
            else {
              // Reset positions
              player.x = 9 * TILE_SIZE;
              player.y = 15 * TILE_SIZE;
              player.dir = Direction.NONE;
              ghostsRef.current.forEach((g, i) => {
                g.x = (8 + (i%3)) * TILE_SIZE;
                g.y = 9 * TILE_SIZE;
              });
            }
            return nextL;
          });
        }
      }
    });

    // --- Draw ---
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Maze
    maze.forEach((row, y) => {
      row.forEach((tile, x) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        if (tile === TileType.WALL) {
          ctx.strokeStyle = '#ff00ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(tx + 4, ty + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        } else if (tile === TileType.DOT) {
          ctx.fillStyle = '#ffb8ff';
          ctx.beginPath();
          ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TileType.POWER_PELLET) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    player.draw(ctx, frameRef.current);
    ghostsRef.current.forEach(g => g.draw(ctx, frameRef.current));

    animationIdRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      animationIdRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationIdRef.current);
  }, [gameState]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score]);

  // Initial Load
  useEffect(() => {
    initLevel(0);
  }, [initLevel]);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-[#050505] p-6 font-mono relative select-none text-white overflow-hidden">
      <div className="scanlines" />
      
      {/* HUD Header */}
      <div className="w-full max-w-[1024px] flex justify-between items-end z-10 px-4">
        <div className="flex flex-col">
          <span className="text-[#ff00ff] text-xs tracking-widest mb-1 uppercase font-bold">Current Score</span>
          <div className="text-4xl font-bold leading-none tabular-nums">
            {score.toString().padStart(6, '0')}
          </div>
        </div>

        <div className="flex flex-col items-center pb-2">
          <h1 className="text-5xl font-black italic tracking-tighter text-[#ffff00] drop-shadow-[0_0_8px_rgba(255,255,0,0.5)]">
            Ms. PAC-MAN
          </h1>
          <span className="text-[#00ffff] text-[10px] tracking-[0.3em] uppercase mt-1">Arcade Edition</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[#ff00ff] text-xs tracking-widest mb-1 uppercase font-bold">High Score</span>
          <div className="text-4xl font-bold leading-none text-[#ffb852] tabular-nums">
            {highScore.toString().padStart(6, '0')}
          </div>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div className="relative flex-grow flex items-center justify-center py-8 z-10">
        <div className="relative border-4 border-[#ff00ff] rounded-lg shadow-[0_0_30px_rgba(255,0,255,0.2)] bg-black p-4">
          <canvas
            ref={canvasRef}
            width={19 * TILE_SIZE}
            height={19 * TILE_SIZE}
            className="rounded-sm"
          />

          {/* Overlay States */}
          <AnimatePresence>
            {gameState === 'START' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20 rounded-lg"
              >
                <h2 className="text-5xl font-black italic mb-8 uppercase tracking-widest text-[#ffff00] drop-shadow-[0_0_10px_rgba(255,255,0,0.3)]">READY?</h2>
                <button 
                  onClick={resetGame}
                  className="px-12 py-4 bg-[#ff00ff] text-black font-black text-xl rounded hover:bg-white transition-all transform hover:scale-105 active:scale-95 uppercase shadow-[0_0_15px_rgba(255,0,255,0.5)]"
                >
                  Start Game
                </button>
                <div className="mt-12 text-[10px] text-[#00ffff] flex gap-8 tracking-widest">
                  <span>ARROWS TO MOVE</span>
                  <span>EAT ALL DOTS</span>
                </div>
              </motion.div>
            )}

            {gameState === 'GAMEOVER' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 rounded-lg"
              >
                <h2 className="text-6xl font-black italic mb-8 uppercase tracking-widest text-[#ff4444]">GAME OVER</h2>
                <button 
                  onClick={resetGame}
                  className="px-10 py-3 border-4 border-[#ff00ff] text-[#ff00ff] font-bold text-xl rounded hover:bg-[#ff00ff] hover:text-black transition-all uppercase"
                >
                  Restart Game
                </button>
              </motion.div>
            )}

            {gameState === 'LEVELUP' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 rounded-lg"
              >
                <h2 className="text-5xl font-black italic mb-8 uppercase tracking-widest text-[#00ffff]">Sector Cleared</h2>
                <button 
                  onClick={level >= LEVELS.length - 1 ? () => setGameState('VICTORY') : nextLevel}
                  className="px-12 py-4 bg-[#ffff00] text-black font-black text-xl rounded hover:bg-white transition-all uppercase shadow-[0_0_15px_rgba(255,255,0,0.5)]"
                >
                  Next Sector
                </button>
              </motion.div>
            )}

            {gameState === 'VICTORY' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 rounded-lg"
              >
                <h2 className="text-6xl font-black italic mb-8 uppercase tracking-widest text-[#ffff00] animate-pulse">VICTORY</h2>
                <p className="text-[#00ffff] text-center max-w-[280px] mb-12 text-xs uppercase leading-relaxed tracking-[0.3em]">
                  The maze is silent. You are the master.
                </p>
                <button 
                  onClick={resetGame}
                  className="px-12 py-4 bg-white text-black font-black text-xl rounded hover:bg-[#ff00ff] hover:text-white transition-all uppercase"
                >
                  Start Over
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="w-full max-w-[1024px] pb-8 px-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-6">
          <span className="text-[#ff00ff] text-xs tracking-widest uppercase font-bold">Lives</span>
          <div className="flex gap-2">
            {[...Array(lives)].map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-[#ffff00] shadow-[0_0_8px_rgba(255,255,0,0.4)]" />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#ffff00]" />
            <span className="text-[10px] text-[#00ffff] uppercase tracking-widest">Player</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {GHOST_COLORS.map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-t-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-[10px] text-[#00ffff] uppercase tracking-widest">Ghosts</span>
          </div>
        </div>

        <div className="text-[#ffb852] text-xs tracking-widest uppercase font-bold">
          Sector: <span className="text-white ml-2 text-sm">{level + 1}</span>
        </div>
      </div>
      {/* Decorative Grid Lines */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
    </div>
  );
}
