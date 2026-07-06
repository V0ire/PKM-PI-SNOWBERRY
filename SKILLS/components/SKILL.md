# Shared UI Components Skill

## TiltCard
3D tilt hover effect for cards using mouse position tracking.
```typescript
// Tracks mouse position relative to card
// Applies rotateX/rotateY transforms
// Spring animation with Framer Motion
// Glow effect on hover
```

## MagneticButton
Magnetic hover effect for buttons.
```typescript
// Tracks mouse position
// Applies x/y offset with spring
// Scale up on hover
// whileTap scale down
```

## ModalPortal
React Portal for modals to avoid fixed-position bugs.
```typescript
import { createPortal } from 'react-dom';
// Creates portal on document.body
// Scroll lock on open
// Escape key close
// z-[9999]
```

## RouteLoadingOverlay
Shows loading screen when navigating between routes.
```typescript// Listens to custom event 'verse:route-loading'
// Shows fullscreen overlay with VERSE logo
// Auto-hide after 1.5s
```

## AcademyLink
Link component that shows loading overlay before navigation.
```typescript
<button onClick={() => {
  emitRouteLoading({ label: 'Loading Academy', href });
  setTimeout(() => router.push(href), 200);
}}>
```

## XPToast
Centered floating XP gain animation.
```typescript
// Listens to 'verse:progress-updated' event
// Shows +XP toast with spring animation
// Level up notification
// Auto-hide after 3s
```
