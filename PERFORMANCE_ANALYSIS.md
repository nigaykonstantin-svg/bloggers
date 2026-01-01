# Performance Analysis Report

This document identifies performance anti-patterns, N+1 query patterns, unnecessary re-renders, and inefficient algorithms in the codebase.

---

## Critical Issues

### 1. Context Value Objects Recreated on Every Render

**Severity: HIGH** | **Impact: Unnecessary re-renders across entire component trees**

All context providers create new object literals on every render, causing all consumers to re-render even when values haven't changed.

**Affected Files:**

#### `src/context/AuthContext.jsx:125-135`
```jsx
// BAD: New object created on every render
<AuthContext.Provider value={{
    user,
    isAdmin,
    isLoading,
    login,
    adminLogin,
    register,
    logout,
    updateUser,
    telegramLogin,
}}>
```

**Fix:** Memoize context value and callbacks:
```jsx
const login = useCallback(async (email, password) => { ... }, []);
const logout = useCallback(() => { ... }, []);
// ... memoize all functions

const value = useMemo(() => ({
    user, isAdmin, isLoading, login, adminLogin, register, logout, updateUser, telegramLogin
}), [user, isAdmin, isLoading]);
```

#### `src/context/CartContext.jsx:43-52`
Same issue - context value recreated on every render.

#### `src/data/collaborations.jsx:155-168`
Same issue - context value recreated on every render.

#### `src/context/TelegramContext.jsx:124-137`
Same issue - all helper functions (`showAlert`, `showConfirm`, `hapticFeedback`, etc.) are recreated on every render.

---

### 2. N+1 Query Pattern - Product Lookups in Loops

**Severity: HIGH** | **Impact: O(n*m) complexity for rendering lists**

Multiple components call `getProductById()` inside `.map()` loops, causing O(n*m) lookups.

**Affected Files:**

#### `src/pages/Dashboard.jsx:252-261`
```jsx
{collab.products.slice(0, 3).map(productId => {
    const product = getProductById(productId);  // Called 3 times per collab
    return product ? ( ... ) : null;
})}
```

#### `src/pages/Collaborations.jsx:84-93` and `:146-155`
Same pattern - `getProductById()` called inside loops.

#### `src/pages/admin/AdminDashboard.jsx:333-352`
```jsx
stats.pending.slice(0, 3).map(collab => {
    const blogger = bloggers.find(b => b.id === collab.bloggerId);  // Linear search in loop
    ...
})
```

**Fix:** Create a Map for O(1) lookups:
```jsx
// In products.js
export const productsById = new Map(products.map(p => [p.id, p]));
export const getProductById = (id) => productsById.get(id);

// Or memoize the lookup map in component:
const productsMap = useMemo(() =>
    new Map(products.map(p => [p.id, p])),
[]);
```

---

### 3. Stale Module-Level Exports

**Severity: HIGH** | **Impact: Data inconsistency bugs**

#### `src/data/collaborations.jsx:182-185`
```jsx
// These are called ONCE at module load and never update!
export const collaborations = getStoredCollaborations();
export const getCollaborationsByBloggerId = (bloggerId) => collaborations.filter(...);
export const getCollaborationById = (id) => collaborations.find(...);
export const getActiveCollaborations = () => collaborations.filter(...);
```

This creates a stale snapshot that never reflects updates from the context.

#### `src/pages/admin/Analytics.jsx:3-4`
```jsx
import { collaborations } from '../../data/collaborations';
// Uses stale module-level export instead of context
```

**Fix:** Remove legacy exports entirely. Use only the context hook `useCollaborations()`.

---

### 4. No Code Splitting / Lazy Loading

**Severity: MEDIUM** | **Impact: Large initial bundle, slow first load**

#### `src/App.jsx:7-33`
All 18 page components are imported synchronously at the top level:
```jsx
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// ... 15 more imports
```

**Fix:** Use React.lazy() and Suspense:
```jsx
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// In render:
<Suspense fallback={<LoadingSpinner />}>
    <Routes>...</Routes>
</Suspense>
```

---

### 5. Expensive Computations Without Memoization

**Severity: MEDIUM** | **Impact: Unnecessary CPU work on every render**

#### `src/pages/Leaderboard.jsx:12-17`
```jsx
// These run on EVERY render, not just when dependencies change
const filteredBloggers = selectedLevel === 'all'
    ? bloggers
    : bloggers.filter(b => b.level === selectedLevel);

const sortedBloggers = [...filteredBloggers].sort((a, b) => b.points - a.points);
const userRank = sortedBloggers.findIndex(b => b.id === user?.id) + 1;
```

**Fix:**
```jsx
const sortedBloggers = useMemo(() => {
    const filtered = selectedLevel === 'all'
        ? bloggers
        : bloggers.filter(b => b.level === selectedLevel);
    return [...filtered].sort((a, b) => b.points - a.points);
}, [selectedLevel]);

const userRank = useMemo(() =>
    sortedBloggers.findIndex(b => b.id === user?.id) + 1,
[sortedBloggers, user?.id]);
```

#### `src/pages/admin/AdminDashboard.jsx:46-49`
```jsx
// Recalculated on every render
const statsByLevel = levelOrder.reduce((acc, levelId) => {
    acc[levelId] = bloggers.filter(b => b.level === levelId).length;
    return acc;
}, {});
```

#### `src/pages/admin/Analytics.jsx:9-30`
```jsx
// All these computations run on every render
const productRequests = collaborations.flatMap(c => c.products);
const productCounts = productRequests.reduce(...);
const topProducts = Object.entries(productCounts).sort(...);
const erByLevel = levelOrder.map(...);
```

---

### 6. Inline Function Definitions in JSX

**Severity: MEDIUM** | **Impact: New functions created on every render, breaks memoization**

#### `src/components/layout/DashboardLayout.jsx:25-31`
```jsx
<Sidebar
    isOpen={sidebarOpen}
    onClose={() => setSidebarOpen(false)}  // New function every render
/>
<Navbar onMenuClick={() => setSidebarOpen(true)} />  // New function every render
```

**Fix:**
```jsx
const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);
const handleMenuClick = useCallback(() => setSidebarOpen(true), []);
```

#### `src/pages/Products.jsx:141-162`
Multiple inline `onClick` handlers for category buttons.

---

### 7. Missing React.memo on List Item Components

**Severity: MEDIUM** | **Impact: All list items re-render when any item changes**

#### `src/components/products/ProductCard.jsx`
```jsx
// Not memoized - re-renders when parent's cart or any other state changes
export default function ProductCard({ product, showAddButton = true }) { ... }
```

**Fix:**
```jsx
export default React.memo(function ProductCard({ product, showAddButton = true }) {
    // ...
}, (prevProps, nextProps) => {
    return prevProps.product.id === nextProps.product.id &&
           prevProps.showAddButton === nextProps.showAddButton;
});
```

---

### 8. Timer-Based Components Without Cleanup Optimization

**Severity: LOW** | **Impact: Unnecessary interval activity**

#### `src/components/ui/CountdownTimer.jsx:22-28`
```jsx
useEffect(() => {
    const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
    }, 1000);  // Runs every second even if compact mode only shows days/hours

    return () => clearInterval(timer);
}, [deadline]);
```

**Fix:** For compact mode, update less frequently:
```jsx
useEffect(() => {
    const interval = compact ? 60000 : 1000; // 1 min for compact, 1 sec otherwise
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), interval);
    return () => clearInterval(timer);
}, [deadline, compact]);
```

---

### 9. AnimatedCounter Reruns Animation on Every Parent Render

**Severity: LOW** | **Impact: Flickering animations**

#### `src/components/ui/AnimatedCounter.jsx:6-26`
The animation restarts when `value` changes, which is correct. But if the parent re-renders frequently (which it does due to issues above), this could cause visual jitter.

---

### 10. Redundant Context Dependencies

**Severity: MEDIUM** | **Impact: Unnecessary re-renders when unrelated data changes**

#### `src/pages/Collaborations.jsx:14-16`
```jsx
const collaborations = useMemo(() => {
    return getCollaborationsByBloggerId(user?.id) || [];
}, [user, getCollaborationsByBloggerId]);  // user object reference changes often
```

**Fix:** Depend on `user?.id` only, not the entire `user` object.

#### `src/pages/Dashboard.jsx:17-19`
Same issue - depends on `collaborations` array reference which changes on any collaboration update.

---

### 11. Filter/Map Operations Without Early Exit

**Severity: LOW** | **Impact: Processes full arrays when early termination could be used**

#### `src/data/levels.js:114-120`
```jsx
export function calculateLevel(followers, er) {
    for (const levelId of [...levelOrder].reverse()) {  // Creates new array
        const level = levels[levelId];
        if (followers >= level.minFollowers && er >= level.minER) {
            return levelId;
        }
    }
    return 'beginner';
}
```

**Fix:** Store reversed order statically:
```jsx
const levelOrderReversed = [...levelOrder].reverse();
export function calculateLevel(followers, er) {
    for (const levelId of levelOrderReversed) { ... }
}
```

---

## Summary Table

| Issue | Severity | Type | Files Affected |
|-------|----------|------|----------------|
| Context values not memoized | HIGH | Re-renders | 4 context files |
| N+1 product lookups in loops | HIGH | Algorithm | 5 page files |
| Stale module-level exports | HIGH | Data bug | collaborations.jsx, Analytics.jsx |
| No code splitting | MEDIUM | Bundle size | App.jsx |
| Missing useMemo for computations | MEDIUM | CPU waste | 3+ page files |
| Inline functions in JSX | MEDIUM | Re-renders | Layout, Products |
| Missing React.memo on list items | MEDIUM | Re-renders | ProductCard.jsx |
| Frequent timer intervals | LOW | Battery | CountdownTimer.jsx |
| Redundant context dependencies | MEDIUM | Re-renders | Multiple pages |

---

## Recommended Priority Order

1. **Fix context memoization** - Biggest impact, affects entire app
2. **Convert product lookups to Map** - O(1) vs O(n) for every list render
3. **Remove stale module exports** - Prevents data inconsistency bugs
4. **Add React.lazy code splitting** - Improves initial load time
5. **Memoize expensive computations** - Reduces CPU usage
6. **Add React.memo to list components** - Prevents cascade re-renders

---

## Performance Testing Recommendations

1. Use React DevTools Profiler to identify re-render cascades
2. Add `why-did-you-render` library during development
3. Monitor bundle size with `vite-plugin-visualizer`
4. Use Lighthouse CI to track performance regression
