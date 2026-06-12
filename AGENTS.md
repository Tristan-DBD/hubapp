# HubApp — AGENTS.md

## Quick start
```sh
npm start            # Terminal 1: Metro dev server
npm run android      # Terminal 2: build + install (after Metro is ready)
npm test             # Vitest (all tests)
npm run test:run     # Vitest single run
npm run create:module <name>  # Scaffold a new module
npm run release              # APK release (arm64-v8a only, ~5-7 min)
```

## Architecture
- **Hub screen** (`src/app/HubScreen.tsx`) — pure launcher, zero business logic. Reads module registry, renders cards.
- **Modules** (`src/modules/<name>/`) — fully independent. Each has `domain/`, `ui/`, `tests/`. Loaded lazily: only initializes when its screen mounts.
- **DB layer** (`src/core/db/`) — namespace-prefixed key-value storage via `react-native-mmkv`. Modules never import MMKV directly; they use `dbManager.getDB(moduleId)`.
- **Module registry** (`src/core/module-registry/`) — metadata-only (id, name, icon, `loadScreen`). `registerAllModules` runs at module scope in `App.tsx` and only stores metadata — it never calls `loadScreen`. Screens are loaded lazily via `LazyScreen` (`src/app/LazyScreen.tsx`) only when the user navigates to a module. `initAllModules` is NOT called at startup; each screen self-inits in a `useEffect`.

## Critical constraints
- **NO SQLite.** Only MMKV via `src/core/db/storage/mmkv.ts`.
- **MMKV must be lazy.** Never `new MMKV()` at module scope — use `getStorage()` inside `mmkv.ts`.
- **No module-scope side effects.** Never call native module functions (e.g. `GoogleSignin.configure()`) or `dbManager.getDB()` at module scope — wrap in lazy `import()` or inside component hooks.
- **Dynamic imports in auto-imports.ts.** Module registration uses `import()` with try-catch so one broken module never crashes the whole app.
- **Android only.** iOS files (`ios/`, `Gemfile`) removed. Keep it that way unless explicitly asked.
- **Full offline.** No backend, no cloud, no network calls.

## Android native quirks
- `MainActivity.kt` must override `onCreate(savedInstanceState)` with `super.onCreate(null)` for `react-native-screens`.
- `app.json` `name` must match `getMainComponentName()` in `MainActivity.kt` (both `"HubApp"`).

## Testing
- **Vitest** with global test helpers. Setup file: `__vitest__/setup.ts` — mocks `react-native-mmkv` with an in-memory `Map`.
- Account tests cover finance logic, archive, month-switch, and module isolation. Pure domain logic only (no native modules).
- DB wrapper tests in `src/core/db/tests/db-wrapper.test.ts` — require the mock setup.

## Theme
- Centralised in `src/core/theme.ts`. Dark theme: black (`#0a0a0f`) + violet (`#7c3aed`).
- All screens import `{ theme } from '../../core/theme'`. Use theme tokens, never hardcoded colors.

## Module conventions
- `useState(() => db.get('key') || default)` for initial data load from DB.
- `useEffect` on mount for `dbManager.registerModule(id)` and auto-archive logic.
- Path from `ui/`: `../../../core/...` to reach `src/core/`.
- Module `index.ts` exports `AppModule` with id, name, icon, `loadScreen` (no init — screens self-init). `auto-imports.ts` registers modules with hardcoded metadata — module `index.ts` is never imported at startup.
