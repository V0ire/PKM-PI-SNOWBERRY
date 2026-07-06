# 3D Hero Scene Skill

## Overview
Build a premium 3D hero with React Three Fiber: globe, orbiting logo coins, particles, mouse parallax.

## Dependencies
```bash
npm install three @react-three/fiber @react-three/drei
```

## Hero Scene Structure
```
HeroScene3D.tsx
├── InnerGlobe (meshStandardMaterial, emissive purple)
├── GradientGlow (additive blending sphere)
├── AtmosphereRim (BackSide sphere, cyan)
├── GlobeGrid (latitude/longitude torus rings)
├── OrbitRing ×3 (thin torus rings)
├── OrbitingLogoCoin ×3 (Bitcoin, VERSE, Polygon)
├── Sparkles ×3 (different colors/scales)
└── MouseParallax (cursor follow)
```

## OrbitingLogoCoin Component
```typescript
// 3 ref groups for independent motion:
// 1. orbitPlaneRef — tilted plane of orbit
// 2. orbitPositionRef — moves around globe
// 3. coinSpinRef — coin itself spins/tumbles

// Motion:
orbitPlaneRef.current.rotation.y = t * orbitSpeed;
coinSpinRef.current.rotation.y += delta * spinSpeedY;
coinSpinRef.current.rotation.x += delta * spinSpeedX * 0.25;
coinSpinRef.current.rotation.z += delta * spinSpeedZ * 0.2;
```

## Performance Rules
- `dpr={[1, 1.5]}` — cap pixel ratio
- `dynamic(() => import(...), { ssr: false })` — lazy load
- Mobile: `viewport.width < 5` → scale 0.72, reduce sparkles
- `castShadow={false}` on all meshes
- `pointer-events-none` on canvas wrapper
- No black/dark halo meshes — only colored additive glow
- `toneMapped={false}` on glow materials

## Logo Assets
Place in `public/brand/`:
- bitcoin-logo.png
- verse-logo.png
- polygon-logo.png

## Responsive Container
```tsx
<div className="pointer-events-none absolute left-1/2 top-[48%] z-0
  h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-90
  sm:h-[620px] sm:w-[620px] md:h-[760px] md:w-[760px]
  lg:h-[880px] lg:w-[880px] xl:h-[980px] xl:w-[980px]
  max-[480px]:h-[390px] max-[480px]:w-[390px]
  max-[380px]:h-[340px] max-[380px]:w-[340px]">
  <HeroScene3D />
</div>
```

## Mouse Parallax
```typescript
function MouseParallax({ children }) {
  const groupRef = useRef<THREE.Group>(null);
  const idleRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    idleRef.current += delta * 0.05;
    const targetY = state.pointer.x * 0.15;
    const targetX = -state.pointer.y * 0.12;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, idleRef.current + targetY, 0.06
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x, targetX, 0.06
    );
  });

  return <group ref={groupRef}>{children}</group>;
}
```
