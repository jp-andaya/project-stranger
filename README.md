# Project Stranger

An anonymous storytelling mental health web app where users respond to daily prompts by dropping notes into a bowl and can pick random notes from strangers to read.

## Features

- 🫙 **The Bowl** - Visual fishbowl metaphor for collecting anonymous stories
- ✍️ **Daily Prompts** - New prompt each day with typing animation
- 👤 **Complete Anonymity** - No accounts, no tracking, no cookies
- 🌓 **Dark/Light Mode** - Pill-shaped theme toggle
- ❤️ **Send Warmth** - Like stories without identity
- 📚 **Archive** - Browse past prompts and their stories

## Tech Stack

- React 18
- Vite
- CSS Modules
- Context API for state management

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Bowl.jsx        # Fishbowl with notes
│   ├── BowlIcon.jsx    # Header logo
│   ├── Header.jsx      # Navigation header
│   ├── StoryCard.jsx   # Story display card
│   └── ThemeToggle.jsx # Dark/light mode switch
├── context/            # React Context providers
│   ├── NotesContext.jsx
│   └── ThemeContext.jsx
├── data/               # Sample data
│   └── sampleData.js
├── hooks/              # Custom hooks
│   └── useTypingAnimation.js
├── styles/             # Global styles and themes
│   ├── global.css
│   └── themes.js
├── views/              # Page components
│   ├── About.jsx
│   ├── Archive.jsx
│   ├── Confirmation.jsx
│   ├── Home.jsx
│   └── Read.jsx
├── App.jsx             # Root component
└── main.jsx            # Entry point
```

## Design

- **Dark Mode**: Black background (#0a0a0b), amber accents (#c9a87c, #e4c9a8)
- **Light Mode**: Cream background (#f8f6f3), brown accents (#8b7355)
- **Typography**: Cormorant Garamond (serif, prompts), Inter (sans-serif, UI)
- **Bowl**: Glass fishbowl with colourful paper notes inside

## Author

John Andaya - UWE Bristol Digital Systems Project (UFCFXK-30-3)
