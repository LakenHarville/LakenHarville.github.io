# 🐸 Frog Portfolio — Laken Harville

A creative portfolio website featuring a 3D frog exploration game. Navigate a glowing forest world as a frog to discover portfolio sections, or use the traditional navbar on mobile/tablet.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open http://localhost:5173 in your browser
```

## Project Structure

```
frog-portfolio/
├── index.html                    # Entry HTML (loads fonts)
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite bundler config
├── public/                       # Static assets (put your photo here!)
└── src/
    ├── main.jsx                  # React entry point
    ├── index.css                 # Global styles & design system
    ├── App.jsx                   # Root component with routes
    ├── App.css                   # Background effects
    ├── components/
    │   ├── Navbar.jsx            # Responsive navbar (hamburger on mobile)
    │   ├── Navbar.css
    │   └── FrogGame/
    │       ├── FrogGame.jsx      # Game wrapper + HUD overlay
    │       ├── FrogGame.css      # Game UI styles
    │       ├── GameScene.jsx     # 3D environment (lights, ground, decor)
    │       ├── Frog.jsx          # Player character (movement, hop, camera)
    │       └── GameElement.jsx   # Interactive portal collectibles
    └── pages/
        ├── Home.jsx              # Hero section + game CTA
        ├── Home.css
        ├── Resume.jsx            # Professional experience & skills
        ├── Education.jsx         # Academic background
        ├── Projects.jsx          # Portfolio project showcase
        ├── Interests.jsx         # Personal interests & hobbies
        └── PageStyles.css        # Shared styles for all content pages
```

## Customization Checklist

### 🖼️ Your Photo
1. Add your photo to the `/public` folder (e.g., `your-photo.jpg`)
2. Open `src/pages/Home.jsx`
3. Uncomment the `<img>` tag and remove the placeholder `<div>`
4. Update the `src` attribute to match your filename

### 📝 Content (all in `src/pages/`)
- **Home.jsx** — Update bio text, social media links
- **Resume.jsx** — Add experience, update skills
- **Education.jsx** — Fill in your education details
- **Projects.jsx** — Add your real projects to the `projects` array
- **Interests.jsx** — Personalize interests

### 🎨 Theming
All colors are CSS variables in `src/index.css`. Change the `--accent-primary` variable to change the whole site's accent color:
```css
--accent-primary: #00e87b;  /* Change this to any color! */
```

### 🔊 Adding Sound (Future Enhancement)
The game is set up for easy sound integration. You can use the Howler.js library:
```bash
npm install howler
```
Then in `Frog.jsx`, import and play sounds on hop, on portal activation, etc.

### 🎮 Game Tuning
In `src/components/FrogGame/Frog.jsx`, adjust these constants:
```js
const MOVE_SPEED = 6        // Frog movement speed
const HOP_DURATION = 0.4    // How long a hop takes (seconds)
const HOP_HEIGHT = 1.2      // How high the frog jumps
const BOUNDARY = 12          // Play area size
const INTERACT_DISTANCE = 3.5 // How close to activate portals
```

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **React Router 6** | Client-side routing |
| **Three.js** | 3D graphics engine |
| **React Three Fiber** | React renderer for Three.js |
| **@react-three/drei** | Useful Three.js helpers |
| **Vite** | Build tool & dev server |

## Key Architecture Decisions

**Why React Three Fiber instead of vanilla Three.js?**
R3F lets you write Three.js scenes as React components. This means you get React's component model (reusability, state management, lifecycle) applied to 3D — instead of imperative "create mesh, add to scene" code, you write declarative JSX.

**Why separate FrogGame.jsx from GameScene.jsx?**
The `<Canvas>` creates its own React reconciler. Components inside can't use DOM hooks like `useNavigate`. The wrapper handles routing and UI; the scene handles 3D. They communicate via props/callbacks.

**Why useRef for game state instead of useState?**
`useState` triggers re-renders (60/sec = bad). `useRef` mutates values directly without re-rendering — essential for smooth 60fps game loops.

## Building for Production

```bash
npm run build
```

Output goes to `/dist`. Deploy to Vercel, Netlify, GitHub Pages, or any static host.

## License

This is your personal portfolio — use it however you like!
