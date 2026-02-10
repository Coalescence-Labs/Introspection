# Deployment Guide

## Vercel Deployment (Recommended)

Introspection is designed to deploy cleanly to Vercel with zero configuration.

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure everything
   - Click "Deploy"

That's it! Vercel will:
- Auto-detect Next.js
- Install dependencies with `bun`
- Run build command
- Deploy to global CDN
- Provide HTTPS and custom domain support

### Vercel Configuration

No special configuration needed. The app uses default Next.js settings which Vercel handles automatically.

If you want to customize, create `vercel.json`:

```json
{
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "framework": "nextjs"
}
```

## Environment Variables

For the MVP, no environment variables are required. The app is fully static.

For future editorial pipeline (Mode B with real LLM API calls), you'll add:

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=...
```

Add these in Vercel Dashboard → Settings → Environment Variables.

## Production Checklist

Before deploying to production:

- [ ] Update version in `package.json`
- [ ] Run tests: `bun run test`
- [ ] Run linter: `bun run lint`
- [ ] Validate content: `bun run pipeline:validate`
- [ ] Test build locally: `bun run build && bun run start`
- [ ] Review questions in content/questions.ts
- [ ] Ensure all questions have proper categories and tags
- [ ] Test on mobile devices
- [ ] Test all LLM selector options
- [ ] Test copy-to-clipboard functionality
- [ ] Test speech-friendly toggle
- [ ] Verify dark mode works (if enabled)

## Custom Domain

In Vercel Dashboard:
1. Go to your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificate

## Monitoring

Vercel provides built-in:
- Analytics (pageviews, unique visitors)
- Web Vitals monitoring
- Error tracking
- Build logs

## Continuous Deployment

Once connected to GitHub, Vercel automatically:
- Deploys on every push to `main`
- Creates preview deployments for pull requests
- Runs build checks on each commit

## Alternative Platforms

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Netlify auto-detects Next.js and configures correctly.

### Cloudflare Pages

1. Connect your GitHub repository
2. Set build command: `bun run build`
3. Set output directory: `.next`
4. Deploy

### Self-Hosted

```bash
# Build
bun run build

# Start production server
bun run start

# Or export static files
# (requires output: 'export' in next.config.js)
bun run build
# Static files in /out directory
```

## Performance

Expected Lighthouse scores:
- Performance: 95-100
- Accessibility: 95-100
- Best Practices: 95-100
- SEO: 90-100

The app is optimized for:
- Fast initial load (< 1s)
- Minimal JavaScript payload
- Static generation
- CDN caching
- Image optimization (none in MVP)

## Costs

### Vercel Free Tier Includes:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic SSL
- Global CDN
- Preview deployments

For Introspection MVP (static site), you'll stay within free tier limits.

## Future: Pipeline Deployment

When implementing Mode B (editorial pipeline):

1. **Serverless Functions**
   - Create `/api` routes for generation
   - Deploy as Vercel Serverless Functions
   - Configure cron jobs for scheduled regeneration

2. **Environment Variables**
   - Add API keys for LLM providers
   - Never expose keys to client
   - Use Vercel's encrypted environment variables

3. **Content Deployment Flow**
   ```
   Pipeline generates variants
   → Commit to content files
   → Push to GitHub
   → Vercel auto-deploys
   → Users see updated content
   ```

## Troubleshooting

### Build Fails

```bash
# Check locally
bun run build

# Common fixes:
bun install  # Reinstall dependencies
rm -rf .next  # Clear build cache
bun run lint:fix  # Fix linting errors
```

### Preview URL Not Working

- Ensure all routes are properly exported
- Check for client-side only code in server components
- Verify all imports are correct

### Slow Builds

- Vercel caches node_modules between builds
- First build is slower, subsequent builds are faster
- Average build time: 20-40 seconds

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Community: https://github.com/vercel/next.js/discussions
