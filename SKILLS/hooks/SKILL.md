# Custom Hooks Skill

## usePageVisible
Pauses animations when tab is hidden.
```typescript
export function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    onChange();
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}
```

## useIsInViewport
Pauses animations when element is offscreen.
```typescript
export function useIsInViewport(ref: RefObject<Element>, rootMargin = '160px') {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
```

## useReducedMotion
Respect user's motion preferences.
```typescript
import { useReducedMotion } from 'framer-motion';
// Returns true if user prefers reduced motion
```

## Pattern: Pause When Offscreen
```typescript
const inView = useIsInViewport(ref, '240px');
const pageVisible = usePageVisible();
const reduceMotion = useReducedMotion();
const paused = !inView || !pageVisible || !!reduceMotion;

// Use in component:
<div className={paused ? 'animation-paused' : ''}>
  <Canvas frameloop={paused ? 'demand' : 'always'}>
```
