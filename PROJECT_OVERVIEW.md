# Decision Hub

## Overview
Decision Hub is a comprehensive multi-game web application built for groups to make decisions fun and interactive. It provides a variety of mini-games and tools such as finger dice, coin flip, dice roller, random picker, color roulette, reaction time, and draw straws.

## Tech Stack
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **Animations**: Framer Motion
- **Language**: TypeScript

## Structure
- `app/` - Next.js App Router core files (`layout.tsx`, `page.tsx`, `globals.css`).
- `components/` - React components, separated into main UI elements, games, and reusable core UI components.
  - `games/` - Individual game implementations.
  - `ui/` - Reusable design system components.
- `lib/` - Utility functions, context providers (e.g., Language Context, Stats Store).
- `hooks/` - Custom React hooks.

## Features
- Multiple mini-games for decision making.
- Bilingual Support (Hebrew & English).
- Shared Stats Center for game history.
- Smooth animations and transitions.

## Getting Started
1. Run `npm install` to install dependencies.
2. Run `npm run dev` to start the development server.
3. Open `http://localhost:3000` in your browser.
