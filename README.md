# Movie App Mega X-Treme 3000

A React client for [MovieApi-CA](https://github.com/laszloprekop/MovieApi-CA)
Övning 11 in the Lexicon/LTU frontend course.

- full CRUD over the movie catalogue
- detail pages with reviews and actors
- filtering
- admin dashboard
- and ⋆✴︎˚｡⋆ **Gissa filmen** ⟡˙⋆, a quiz built from the catalogue's own data.

╭────────────────────.★..─╮

**LIVE DEMO:** [👉 _Movie App Mega X-Treme 3000_ 👈](https://laszloprekop.github.io/fe-11-movie-app/)

╰─..★.────────────────────╯

## Stack

- React 19 + TypeScript, Vite
- React Router 7 (`BrowserRouter` / `Routes` / `Route`)
- Tailwind 4, Vitest
- Backend: MovieApi-CA (.NET 10, Clean Architecture), hosted on Coolify

## Run it

```bash
npm install
npm run dev     # expects the API base URL in VITE_API_URL (see .env.example)
```

Domain vocabulary lives in [CONTEXT.md](CONTEXT.md).
