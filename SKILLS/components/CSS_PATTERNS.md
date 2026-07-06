# CSS Patterns Skill

## globals.css Key Patterns

### Base Variables
```css
:root {
  --background: #0a0e27;
  --foreground: #ffffff;
  --accent: #7c3aed;
  --gradient-1: linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%);
  --glass: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

### Glass Effect
```css
.glass {
  background: var(--glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}
```

### Gradient Text
```css
.gradient-text {
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Mobile Touch Optimization
```css
button, a, [role="button"], input, select, textarea {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 768px) {
  button, a, [role="button"] { min-height: 44px; }
}
```

### Animation Pause
```css
.animation-paused,
.animation-paused * {
  animation-play-state: paused !important;
}
```

### Content Visibility
```css
.cv-auto {
  content-visibility: auto;
  contain-intrinsic-size: 900px;
}
```

### Scroll Margin
```css
section { scroll-margin-top: 5rem; }
```

### Story Orbit Keyframes
```css
@keyframes story-orbit {
  from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
  to { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); }
}
```
