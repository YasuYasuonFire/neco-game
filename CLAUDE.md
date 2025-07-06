# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 2D side-scrolling racing game called "ねこねこスピードレース" (Neko Neko Speed Race). Players control cute cat characters in a race against NPCs to reach the goal line first.

## Architecture

### Core Components

- **Frontend**: Vanilla HTML5 Canvas game with no external frameworks
  - `index.html` - Main game interface with styled UI components
  - `game.js` - Complete game engine with NekoRaceGame class
  - Inline CSS styling with gradient animations and modern UI effects

- **Backend**: Node.js/Express API server
  - `server.js` - Express server with SQLite database integration
  - `database.db` - SQLite database for user accounts and leaderboard scores
  - RESTful API endpoints for user management and score tracking

### Game Engine Structure

The `NekoRaceGame` class in `game.js` handles:
- **Game States**: 'menu', 'playing', 'finished', 'allclear'
- **Camera System**: Follows player with smooth easing and world bounds
- **Physics**: Mario-style platformer physics with gravity, friction, and jump mechanics
- **Character System**: 6 unique cat characters with different abilities and stats
- **World Generation**: 3000px wide scrolling world with procedural obstacles and items
- **Multi-stage Progression**: 3 stages with increasing difficulty

### Key Game Features

- **Side-scrolling Racing**: Camera follows player as they race to the goal
- **Character Abilities**: Each cat has unique special abilities (speed boost, jump enhancement, etc.)
- **User Authentication**: Simple username-based login system with localStorage persistence
- **Leaderboard System**: Persistent score tracking with SQLite backend
- **Responsive UI**: Modern gradient-based styling with animations

## Common Development Tasks

### Running the Game

```bash
# Start the backend server
npm start

# Or directly with Node.js
node server.js
```

Server runs on `http://localhost:3000`

### Database Operations

The Neon Database (PostgreSQL) is automatically initialized on first API call. Tables:
- `characters` - Character definitions with abilities and stats
- `users` - User accounts with id, username, created_at
- `scores` - Race results with user_id, character_key, time, stage, created_at

### API Endpoints

- `GET /api/characters` - Get all available characters
- `GET /api/characters/:key` - Get specific character by key
- `POST /api/users` - Register new user
- `GET /api/users/:userId` - Get user info
- `GET /api/users/username/:username` - Get user by username
- `POST /api/scores` - Save race result
- `GET /api/scores` - Get leaderboard (top 100)
- `GET /api/users/:userId/scores` - Get user's scores

## Code Architecture Details

### Game Loop Structure

The game follows a standard game loop pattern:
1. **Update Phase**: Physics, AI, collisions, camera
2. **Draw Phase**: Background, game objects, UI overlays
3. **Input Handling**: Keyboard controls with state tracking

### Character System

Characters are defined in the `characters` object with properties:
- `name`: Display name
- `color`: Primary color for rendering
- `ability`: Special ability type
- `maxSpeed`: Maximum horizontal velocity
- `acceleration`: Movement acceleration rate

### Physics System

Uses precise collision detection with:
- Ground collision at y=520
- Platform collision for jumping mechanics
- Item collection with particle effects
- Obstacle collision with position correction

### Camera System

Implements smooth camera following with:
- Target position calculation based on player position
- Easing for smooth movement transitions
- World bounds checking to prevent off-screen areas

## Development Notes

- The game uses HTML5 Canvas for rendering with 2D context
- No external libraries or frameworks - pure vanilla JavaScript
- Character rendering uses procedural drawing (no sprite images)
- UI styling uses modern CSS features (gradients, animations, backdrop-filter)
- Database operations use Neon Database (PostgreSQL) with @vercel/postgres
- Frontend-backend communication uses fetch API

## Deployment Guidelines

### Vercel Production Deployment

**IMPORTANT**: Only deploy to Vercel production (`vercel --prod`) from the `main` branch.

- **✅ Allowed**: `vercel --prod` when on `main` branch
- **❌ Forbidden**: `vercel --prod` from any other branch (feature branches, development branches, etc.)

### Development/Preview Deployments

For non-main branches, use preview deployments only:
```bash
# For preview/testing (allowed from any branch)
vercel

# For production (ONLY from main branch)
vercel --prod
```

### Branch Management

- Keep only `main` branch in remote repository
- Delete feature branches after merging to main
- Clean up remote branches regularly to maintain repository hygiene

## Game Controls

- **Arrow Keys / A,D**: Move left/right
- **Space**: Jump (hold for higher jump)
- **Shift**: Use special ability (with cooldown)
- **N**: Next stage (after completing a stage)
- **R**: Retry current stage