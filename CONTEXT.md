# Movie App Mega X-Treme 3000

The React client for MovieApi-CA, built for Övning 11 — and the whole thing is presented the way a
1990s direct-to-video distributor would have presented it: maximum name, maximum chrome, stickers
that say **NYHET!** on things that are not new. The brand voice is loud on screen and completely
absent from the code.

Built for Övning 11, so the assignment's subject matter (movies, reviews, actors, genres) is part
of the domain — served by our own MovieApi-CA backend, which remains the single source of truth.
The client never invents movie data.

**Language rule.** English for everything a developer reads: identifiers, comments, commits,
documentation. Swedish for strings the user sees. The brand name itself is the one deliberate
exception — *Movie App Mega X-Treme 3000* is English because that is exactly how Swedish
90s marketing named things.

**Scope marker.** Terms under *The catalogue* are the assignment's own subject matter, defined by
the API. Terms under *The quiz* belong to **Gissa filmen**, the invented Phase 3 dimension — see
`docs/temp/mechanics.md`.

## Language

### The catalogue

**Movie**:
One film in the catalogue, served by the API. Core attributes: title, year, genre, duration.
_On screen_: *film*

**Details**:
The heavier half of a movie — synopsis, language, budget — fetched separately via
`GET /api/movies/{id}/details`.
_On screen_: *detaljer*

**Review**:
A viewer's rating (1–5) and comment on one movie. The API caps reviews per movie (10, or 5 for
movies older than 20 years) and answers violations with ProblemDetails; the client's job is to
surface that as a human sentence, not to re-implement the rule.
_On screen_: *recension*

**Actor** / **Role**:
A person appearing in movies (N:M). The role ("Huvudskurk") is an API extension we add — the
original endpoint takes no role.
_On screen_: *skådespelare*, *roll*

**Genre**:
A movie category. The list of genres comes from `GET /api/genres` (an API extension we add).
_On screen_: *genre*

**The API module**:
The one door — every fetch in the app goes through `src/api/`. Base URL from environment, DTO
types in one place, ProblemDetails parsed in one place. No component ever calls `fetch` directly.

**ProblemDetails**:
The API's standard JSON error body. The client renders it through one error surface; a 400 from a
business rule is a *feature message*, not a crash.

### The quiz — Gissa filmen

**Round**:
One movie to guess. Opens with the free clue, ends in a win, or in giving up.
_On screen_: *omgång*

**Session**:
Five rounds, ending in a total score. Bounded on purpose: a final score is comparable, which is
what makes audience play competitive. Movies never repeat within a session (see *Pool*).
_On screen_: *Kvällens fem* (flavour copy may shout it in brand voice)

**Clue** / **Clue ladder**:
One fact about the round's movie. The ladder is the fixed reveal order, cheapest information
first: duration + language (free), year, genres, actors, masked synopsis. Every paid clue costs
score.
_On screen_: *ledtråd*

**Masked synopsis**:
The synopsis with every word of the title blanked as ███ wherever it appears, so the final clue
cannot simply contain the answer.

**Guess** / **Normalization**:
A free-text title attempt. Both guess and title are normalized before comparing — lowercase,
trimmed, whitespace collapsed, punctuation dropped, å/ä/ö kept. Exact match after normalization;
no fuzzy matching in v1.
_On screen_: *gissning*

**Score** / **Floor**:
A round starts at 1000. Paid clues and wrong guesses subtract; a correct guess always pays at
least the floor (100) — the anti-stall guarantee. Giving up pays 0.
_On screen_: *poäng*

**Streak**:
Consecutive won rounds. Each win adds a bonus scaled by the streak; giving up breaks it.
_On screen_: *svit*

**Pool**:
The movies not yet played this session. Rounds draw from the pool at random; a session is
`min(5, pool)` rounds long.

**Highscore**:
Best session total and best streak, persisted in `localStorage`. Nothing else is persisted.
_On screen_: *rekord*
