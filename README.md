# Project Stranger — Update Pack 2

This update includes: date formatting fix, admin moderation panel, flag notes feature, and GitHub setup guide.

## Files to Copy

### NEW files (add these):
```
src/
├── utils/
│   └── date.js              ← NEW: date formatting utility
├── views/
│   ├── Admin.jsx            ← NEW: admin moderation panel
│   └── Admin.module.css     ← NEW: admin panel styles
```

### REPLACE these existing files:
```
src/
├── App.jsx                       ← adds admin route
├── utils/
│   └── index.js                  ← exports date utils
├── components/
│   ├── Header.jsx                ← adds Admin nav link
│   ├── StoryCard.jsx             ← adds flag/report button
│   └── StoryCard.module.css      ← flag button styles
├── views/
│   ├── Home.jsx                  ← formatted dates
│   ├── Archive.jsx               ← formatted dates
│   └── index.js                  ← exports Admin
```

## What's New

### 1. Date Formatting
- "2026-03-24" → "Monday, 24 March" on the home page
- "Mon, 24 Mar" short format on archive cards

### 2. Admin Moderation Panel
- Dashboard stats: total notes, prompts, warmth, flagged, hidden
- Flagged notes tab: review notes reported by users
- All notes tab: browse every note with hide/restore/delete controls
- Confirmation dialog before permanent deletes
- Action feedback messages

### 3. Flag Notes Feature
- Small flag icon (⚐) on every story card
- Users can report inappropriate content
- Flagged notes appear in admin panel for review
- Flag icon turns solid (⚑) after reporting

### 4. Navigation Update
- "Admin" link added to header nav bar
- Admin panel accessible from any page

---

## GitHub Setup Guide

### First-time setup (run once):

1. Create a new repository on GitHub:
   - Go to github.com → New Repository
   - Name: "project-stranger"
   - Keep it Public or Private (your choice)
   - Do NOT initialise with README (we already have one)
   - Click "Create repository"

2. Open a terminal in your project root:
```powershell
cd C:\Users\johna\Downloads\project-stranger\project-stranger
```

3. Initialise Git and push:
```powershell
git init
git add .
git commit -m "Initial commit - Project Stranger full stack"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/project-stranger.git
git push -u origin main
```

Replace YOUR_USERNAME with your actual GitHub username.

### Create a .gitignore file first!

Before running `git add .`, create a file called `.gitignore` in the project root with:
```
# Dependencies
node_modules/

# Build output
dist/

# Environment
.env
backend/.env

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Python
__pycache__/
*.pyc
*.pyo
```

### Making changes going forward:
```powershell
git add .
git commit -m "Description of what you changed"
git push
```

### Useful commands:
```powershell
git status            # see what's changed
git log --oneline     # see commit history
git diff              # see file changes
```
