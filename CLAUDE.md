# CLAUDE.md — Coding Standards for ghost-dev

## React 19 Best Practices

### Server vs Client Components (Next.js App Router)

- Default to **Server Components** — no `'use client'` unless the component uses hooks, browser APIs, or event handlers
- Keep `'use client'` boundaries as small/deep as possible
- Use `<Suspense>` with a `fallback` for async Server Components and lazy-loaded Client Components
- Never use `useEffect` to fetch data — use Server Components or React Query (`useQuery`) instead

### Concurrent Features

- Use `useTransition` for non-urgent state updates (e.g. filter changes, navigation)
- Use `useDeferredValue` to defer expensive derived values
- Prefer `<Suspense>` over manual loading state where possible

### Actions & Forms (React 19)

- Use React 19 `useActionState` for form submissions instead of manual loading/error state
- Use `useFormStatus` inside form child components to read pending state

---

## Hook Ordering (enforced)

Inside every component, hooks must appear in this order:

1. `useState` — all state declarations at the **very top**
2. `useRef`, `useContext`, `useId`, etc.
3. Custom hooks / React Query hooks (`useQuery`, `useMutation`, etc.)
4. `useMemo`, `useCallback`
5. `useEffect` — always placed **immediately before `return`**

```tsx
// ✅ Correct
export function MyComponent() {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery(...)

  const handleClick = () => { ... }

  useEffect(() => {
    // side effects
  }, [count])

  return <div ref={ref}>...</div>
}
```

---

## Function Declarations Inside Components

All functions defined **inside** a component must use **arrow function** syntax:

```tsx
// ✅ Correct
const handleClick = () => { ... }
const formatLabel = (value: string) => value.toUpperCase()

// ❌ Wrong
function handleClick() { ... }
```

Top-level (module-level) utility functions outside components may use either style, but prefer arrow functions for consistency.

---

## TypeScript

- Always type component props with an inline `interface Props { ... }` (not `type`)
- Avoid `any` — use `unknown` and narrow types explicitly
- Use Zod for runtime validation at API boundaries

---

## Styling (Vanilla Extract)

- All styles live in a co-located `.css.ts` file
- Import as `import * as s from './Component.css'`
- Use design tokens from `styles/tokens.css.ts` — never hardcode colors, spacing, or fonts
- No inline `style` props except for truly dynamic values (e.g. computed widths)

---

## State Management

- **Local UI state:** `useState` / `useReducer`
- **Server/async state:** TanStack React Query (`useQuery`, `useMutation`)
- **Global client state:** Jotai atoms
- Do not mix concerns — React Query owns server state, Jotai owns UI/global state

---

## Naming

- Variable names must clearly describe their role — avoid generic names like `loading`, `data`, `detecting`
- Boolean variables should use a prefix that describes what they represent: `is`, `has`, `should`, `can`
- When renaming destructured values, include enough context to distinguish them from similar variables

```ts
// ❌ Too vague
const { data, isLoading, refetch } = useGitHubRepos();
const detecting = useIsFetching(...) > 0;

// ✅ Clear
const { data: gitHubRepos, isLoading: isGitHubReposLoading, refetch: refetchGitHubRepos } = useGitHubRepos();
const isDetectingMonorepo = useIsFetching(...) > 0;
```

---

## Accessibility (a11y)

- Interactive elements must use semantic HTML — `<button>` for actions, `<a>` for navigation, never `<div onClick>`
- All images require meaningful `alt` text; decorative images use `alt=""`
- Form inputs must have associated `<label>` (via `htmlFor` or wrapping)
- Use `aria-label` or `aria-labelledby` when visible text is absent (e.g. icon-only buttons)
- Use `aria-expanded`, `aria-haspopup`, `aria-controls` for dropdowns and disclosure patterns
- Modals/dialogs must trap focus and restore focus on close; use `role="dialog"` with `aria-modal="true"`
- Maintain logical tab order — avoid `tabIndex` values greater than 0
- Color must not be the only means of conveying information (add text or icons alongside)
- Minimum color contrast ratio: 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- All interactive elements must be keyboard-operable (`Enter`/`Space` for buttons, `Escape` to dismiss overlays)

---

## General

- Prefer composition over prop drilling — use children or compound components
- Keep components small and focused on one responsibility
- No commented-out code in commits
- No `console.log` in production code — use structured logging utilities if needed
