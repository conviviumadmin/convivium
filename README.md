# Convivium Co.

Marketing site for Convivium Co. — `conviviumco.com`.

Static `index.html` with a single Vercel serverless function (`/api/contact.js`) that delivers contact form submissions via Resend.

## Project structure

```
.
├── index.html          # The site
├── api/
│   └── contact.js      # Contact form serverless function
├── public/             # Static assets served from root
│   ├── logo.webp       # Convivium Co. wordmark
│   ├── hand.webp       # Gloved hand holding a card
│   ├── graces.jpg      # Three Graces (hero background + about visual)
│   ├── feast.jpg       # Pomegranate still life (feast interlude)
│   └── favicon.png     # Site favicon
├── vercel.json         # Vercel config (cache headers, clean URLs)
├── package.json
└── README.md
```

## Local development

```bash
npm i -g vercel
vercel dev
```

Open <http://localhost:3000>. The form will hit `/api/contact` locally as long as `vercel dev` is running and `.env.local` has the right env vars (see below).

You can also just open `index.html` in a browser — but the form won't submit without `vercel dev`, and image paths use absolute URLs (`/hand.webp`) so they only work from a proper server root.

## Environment variables

Set these in three places: locally in `.env.local`, and in the Vercel dashboard for both Production and Preview environments.

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | ✅ | Get one at <https://resend.com> → API Keys |
| `TO_EMAIL` | optional | Inbox(es) to deliver form submissions to. **Comma-separated for multiple recipients**, e.g. `mads@conviviumco.com,admin@conviviumco.com`. Default sends to both. |
| `FROM_EMAIL` | optional | Must be a verified domain in Resend. Default `website@conviviumco.com` |

## Deployment guide (start to finish)

### 1. Push to GitHub

```bash
cd /path/to/convivium
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<your-username>/convivium.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to <https://vercel.com> → Add New → Project
2. Import the GitHub repo
3. Framework Preset: **Other** (it's a static site with a function)
4. Leave build/output settings empty — Vercel handles this automatically
5. Click Deploy

You'll get a `*.vercel.app` URL within a minute.

### 3. Set up Resend

1. Sign up at <https://resend.com> (free tier: 100 emails/day, 3000/month)
2. **Add a domain**: Resend → Domains → Add `conviviumco.com`
3. Resend will give you DNS records to add — you'll add these in Porkbun (next step):
   - 1 TXT record for SPF
   - 1 TXT record for DKIM
   - 1 MX record (optional, for receiving — not needed if you use Google Workspace for `@conviviumco.com`)
4. Once domain is verified, create an **API key** under API Keys → Create

### 4. Set up DNS in Porkbun

You'll add two sets of records:

**For email (Resend):**
- Add the TXT and DKIM records Resend gave you in step 3
- Records → Add Record → paste each one

**For the website (Vercel):**
- After deploying in step 2, go to Vercel → your project → Settings → Domains → Add `conviviumco.com`
- Vercel will display the records you need:
  - An **A** record for the apex (`@`) → `76.76.21.21` (or whatever Vercel shows)
  - A **CNAME** for `www` → `cname.vercel-dns.com`
- Add those in Porkbun: Records → Add Record

Wait 5–60 minutes for DNS to propagate. Vercel will auto-issue an SSL cert.

### 5. Set environment variables in Vercel

Vercel → your project → Settings → Environment Variables. Add:

- `RESEND_API_KEY` — paste the key from step 3
- `TO_EMAIL` — `mads@conviviumco.com,admin@conviviumco.com` (comma-separated, no spaces needed)
- `FROM_EMAIL` — e.g. `website@conviviumco.com` (this must use the domain you verified in Resend)

Apply to: Production, Preview, Development.

Redeploy (Deployments tab → click the latest → Redeploy) so the new env vars take effect.

### 6. Test

Visit your live site, fill out the form, click Send. You should:

- See "Thank you. We will be in touch soon."
- Receive the email at `TO_EMAIL` within a few seconds

If anything fails, check Vercel → your project → Logs for the function output.

## Updating the site later

Edit files locally, commit, and push to `main`. Vercel auto-deploys.

For copy edits: `index.html` is straightforward HTML. Text is in plain prose, just find and replace. CSS variables at the top of `<style>` control all the brand colors.

