# VibeMatch Website (pre-launch intro site)

Isolated from the main app — Hinge.co-style marketing site in VibeMatch mobile styling.

- Stack: React + Vite + TypeScript + react-router-dom + framer-motion + lucide-react
- Theme: Space Grotesk, `#09070D → #130B15 → #24111F` fluid background, `#FF4D94 / #FF7B4F` glows, gradient CTA `#FF4E88 → #FF6A71 → #FF7A5E` (ported from `mobile/src/components/FluidBackground.tsx` + `AuthScreen.tsx`)
- Pages: `/` Home (hero, approach, 4 layers, swipe demo, stories, Vibe Lab, waitlist) • `/about` (mission, principles, roadmap) • `/how-it-works` (4 steps, pipeline, FAQ)
- Images: Unsplash (internet) • Icons: Lucide • Waitlist: localStorage (`vibematch_waitlist`)

## Run

```bash
cd website
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # preview prod build
```

Deploy `dist/` to Vercel / Netlify / GitHub Pages. No backend needed.
