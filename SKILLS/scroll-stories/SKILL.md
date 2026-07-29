# Scroll Stories Skill

## Overview
Build annotated orbital infographic scroll stories with SVG callout lines, sticky layout, and active step sync.

## Architecture
```
FeatureStoryHub.tsx
├── SecureWalletStory.tsx
├── ProvablyFairStory.tsx
├── CommunityHubStory.tsx
└── DeveloperToolsStory.tsx

Shared:
├── StoryShell.tsx (layout: sticky + mobile fallback)
├── StoryStepCard.tsx (animated step cards)
├── AnnotatedOrbitVisual.tsx (orbit diagram with SVG lines)
└── orbitStoryConfigs.tsx (node configs per story)
```

## AnnotatedOrbitVisual
- 2D/CSS/SVG (not WebGL)
- Center hub with icon + title
- Inner + outer ellipse orbit rings
- Orbiting nodes with icons
- SVG 2-segment leader lines (node → elbow → label)
- Label chips with title + subtitle
- Active node glow based on story step
- Mouse parallax on card
- Compact mode for mobile
- Paused mode when offscreen

## StoryShell Layout
```
Desktop:
  sticky top-[72px]
  grid-cols-[0.95fr_1.05fr]
  Left: story text + progress rail
  Right: visual (centered in viewport)

Mobile:
  No sticky trap
  Visual at top (compact)
  Steps as stacked cards
  CTAs at bottom
```

## Step-to-Visual Mapping
Each step has `visualNodeId` that maps to an orbit node:
```typescript
const steps = [
  { id: 'own-keys', visualNodeId: 'keys', ... },
  { id: 'seed-backup', visualNodeId: 'seed', ... },
  // ...
];

// In render:
activeNodeId={steps[activeStep]?.visualNodeId}
```

## Viewport Pausing
```typescript
const inView = useIsInViewport(ref, '240px');
const pageVisible = usePageVisible();
const reduceMotion = useReducedMotion();
const paused = !inView || !pageVisible || !!reduceMotion;
```

## CSS
```css
.animation-paused,
.animation-paused * {
  animation-play-state: paused !important;
}
```

## Orbit Node Config
```typescript
type OrbitNode = {
  id: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  ring: 'inner' | 'outer';
  angle: number;        // starting angle
  radius?: number;      // orbit radius
  speed?: number;       // orbit speed
  calloutSide: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};
```
