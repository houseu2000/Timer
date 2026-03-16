# Weekly Focus Planner

A local-first weekly planning app built with React + Vite.

## Features

- Weekly time-block grid (Mon-Sun, 30-minute slots)
- Goal list with drag-to-schedule support
- Goal timer that logs completed focus sessions back into the grid
- Daily reflection notes
- Weekly history archive persisted in local storage

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind (via CDN in `index.html`)

## Run Locally

Prerequisite: Node.js 20+

1. Install dependencies:
   `npm install`
2. Start dev server:
   `npm run dev`
3. Build:
   `npm run build`
4. Preview build:
   `npm run preview`

## Notes

- The app stores data in browser `localStorage`; there is no backend.
- Browser notification permission is requested only when the user clicks "Enable Reminders".
