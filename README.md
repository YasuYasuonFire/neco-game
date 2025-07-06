# 🐱 ねこねこスピードレース (Neko Neko Speed Race)

A 2D side-scrolling racing game featuring cute cat characters with mobile-responsive design.

## 🎮 Features

- **Mobile-Responsive Design**: Touch controls and responsive canvas sizing
- **6 Unique Cat Characters**: Each with special abilities and different stats
- **Real-time Racing**: Compete against AI-controlled NPCs
- **Leaderboard System**: Track your best times with Vercel Postgres
- **Progressive Web App Ready**: Optimized for mobile devices

## 🚀 Deployment

This project is configured for **Vercel** deployment with preview environments.

### Prerequisites

- Node.js 18+
- Vercel account
- Vercel Postgres database

### Environment Variables

Set up these environment variables in your Vercel project:

```bash
POSTGRES_URL=your_vercel_postgres_url
POSTGRES_PRISMA_URL=your_vercel_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_vercel_postgres_non_pooling_url
POSTGRES_USER=your_postgres_user
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Visit http://localhost:3000
```

### Vercel Deployment

The project is configured with `vercel.json` for automatic deployments:

1. **Preview Deployments**: Every PR automatically gets a preview URL
2. **Production Deployment**: Merge to main branch deploys to production
3. **Database**: Automatically connects to Vercel Postgres

## 📱 Mobile Controls

- **Touch Controls**: Displayed automatically on mobile devices
- **Responsive Design**: Canvas scales to fit screen size
- **Optimized Performance**: Throttled resize events and efficient rendering

## 🛠 Technical Stack

- **Frontend**: HTML5 Canvas + Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: Vercel Postgres
- **Deployment**: Vercel Serverless Functions
- **Mobile**: Touch events + responsive design

## 🎯 Game Controls

- **Desktop**: Arrow keys (←→), Space (jump), Shift (special ability)
- **Mobile**: Touch controls displayed on screen

## 🏗 Architecture

- `game.js`: Main game engine with responsive canvas
- `server.js`: Express server with API endpoints
- `api/server.js`: Vercel serverless function wrapper
- `database/db.js`: Database operations with Vercel Postgres
- `vercel.json`: Deployment configuration