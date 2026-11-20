<div align="center">
  <img src="public/logo.svg#gh-dark-mode-only" width="72" alt="Lucas Díaz logo" />
  <img src="public/logo-dark.svg#gh-light-mode-only" width="72" alt="Lucas Díaz logo" />

  <h1>lucas díaz — portfolio</h1>

  <p>Personal site of Lucas Díaz, software developer based in Argentina.<br/>
  Minimal layout, hand-written WebGL interactions, zero UI libraries.</p>

  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs" />
    <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white" />
    <img alt="WebGL" src="https://img.shields.io/badge/WebGL-raw_shaders-990000?logo=webgl&logoColor=white" />
  </p>
</div>

---

## Features

- **Interactive logo** — a raw WebGL fragment shader that displaces the logo with mouse velocity and splits it into RGB channels, then relaxes back to its shape.
- **Interactive type** — the same effect applied to live DOM text (`TextFX`): the real text stays in the DOM (selectable, accessible, clickable) while a WebGL canvas renders it on top.
- **Project detail slide** — the header and footer stay fixed while the content slides horizontally, edge to edge, into each project's detail (description + Loom demo). `Esc` goes back.
- **Tech marquee** — an infinite, edge-cropped marquee of the stack I use, with a letter-by-letter wave on hover.
- **Automatic light / dark** — follows `prefers-color-scheme`, no toggle. The shaders switch between additive and "ink" color separation so the effect works on both themes.
- **Inverted selection** — selected text flips to the opposite theme colors.
- **Accessible by default** — respects `prefers-reduced-motion`, hidden panels are `inert`, effects never block clicks.

## Tech stack

| Layer      | Choice                                   |
| ---------- | ---------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)       |
| UI         | React 19 + TypeScript                    |
| Styling    | Tailwind CSS 4                           |
| Effects    | Raw WebGL + 2D canvas (no dependencies)  |
| Hosting    | Vercel                                   |

## Getting started

Requires Node.js 20+.

```bash
git clone https://github.com/Lucasdiaz-dev/Portfolio-v1.1.git
cd Portfolio-v1.1
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the dev server         |
| `npm run build`     | Production build             |
| `npm run start`     | Serve the production build   |
| `npm run lint`      | Lint with ESLint             |
| `npm run typecheck` | Type-check with TypeScript   |

## Project structure

```text
app/
  page.tsx            # home
  v1/page.tsx         # previous layout, kept for reference
  layout.tsx          # metadata + root layout
  icon.svg            # favicon (adapts to light / dark)
  globals.css         # theme tokens + light mode overrides
components/
  home/Home.tsx       # home layout and project detail slide
  fx/LogoFX.tsx       # WebGL logo effect
  fx/TextFX.tsx       # WebGL effect for DOM text
  fx/TechMarquee.tsx  # footer marquee
  SocialLinks.tsx
  MobileFooter.tsx
  icons.tsx
  v1/                 # components used only by /v1
content/
  site.ts             # name, bio, links
  projects.ts         # project list
public/               # logos and resume
```

## Editing content

All copy lives in `content/`, so updating the site never means touching components.

- **Bio and links:** `content/site.ts`
- **Projects:** `content/projects.ts`. The home shows the first 4 (`MAX_PROJECTS` in `components/home/Home.tsx`). Each project can optionally take:
  - `loom`: a Loom share link, embedded in the detail view
  - `details`: a longer description for the detail view (falls back to `description`)
- **Tech marquee:** the `TECH` list in `components/fx/TechMarquee.tsx`
- **Resume:** replace `public/LucasDiaz-Resume.pdf`

## Deployment

Deployed on [Vercel](https://vercel.com). Every push to `main` triggers a production deploy, and pull requests get preview URLs.

## Contact

- [LinkedIn](https://www.linkedin.com/in/lucasemanueldiaz/)
- [GitHub](https://github.com/Lucasdiaz-dev)
- [lucasdz.dev@gmail.com](mailto:lucasdz.dev@gmail.com)

---

<sub>© 2026 Lucas Díaz. All rights reserved.</sub>
