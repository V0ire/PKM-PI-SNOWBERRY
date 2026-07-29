# Deployment Skill

## Vercel Deployment
```bash
# Build locally first
npm run build

# Build Vercel output
vercel build --prod --token <TOKEN>

# Deploy prebuilt
vercel deploy --yes --prod --prebuilt --token <TOKEN> --name <PROJECT>

# Set alias
vercel alias set <DEPLOYMENT_URL> <ALIAS>.vercel.app --token <TOKEN>
```

## GitHub Push
```bash
git add -A
git commit -m "description"
git push origin main
```

## Environment Variables
Set in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — for WalletConnect QR

## Common Issues

### npm install fails on Vercel
- Use `--legacy-peer-deps` in installCommand
- Or add `.npmrc` with `legacy-peer-deps=true`
- Or use `--ignore-scripts`

### Static export issues
- Remove `output: 'export'` for Vercel (it handles SSR automatically)
- Remove `basePath` unless using GitHub Pages

### Fixed-position modal bugs
- Use React Portal (`createPortal`) on `document.body`
- Avoid modals inside transformed/animated parents
- Use `z-[9999]` for modals

### 3D Canvas blocking clicks
- Canvas wrapper: `pointer-events-none`
- Interactive content: `relative z-10`
- Navbar: `z-50`
- Modal: `z-[9999]`

### Mobile performance
- Cap DPR: `dpr={[1, 1.5]}`
- Reduce particle count on mobile
- Pause offscreen animations
- Use `content-visibility: auto` for heavy sections
- Reduce backdrop-blur on mobile
