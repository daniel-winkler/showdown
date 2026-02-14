# Showdown

A real-time collaborative Planning Poker web application for agile development teams.

## Features

- Create poker rooms with shareable links
- Real-time voting with Fibonacci sequence cards (1, 2, 3, 5, 8,...)
- Visual results with charts
- Unlimited voting rounds

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Socket.IO Client
- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **Storage**: In-memory + LocalStorage

## Project Structure

```
Showdown/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared TypeScript types
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install server dependencies:
```bash
cd server
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
```

### Development

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
cd client
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Usage

1. Create a new poker room
2. Share the room link with your team
3. Each member selects a card value
4. When everyone votes, results are revealed
5. Move to the next round and repeat

## License

MIT
