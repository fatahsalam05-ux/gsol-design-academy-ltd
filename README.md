# Gsol Design Academy — Website

Real, working frontend wired to the live Supabase backend (courses, auth,
enrollments, progress tracking, Q&A, and Paystack/Flutterwave checkout).

## What's already live and doesn't need touching
- Supabase project: `gsol-design-academy` (id `qiymevvbgpbeuyzafciu`)
- Database schema, RLS policies, and all course/bundle/ebook content
- Two edge functions: `checkout-init` (starts a payment) and `payment-webhook`
  (confirms payment and activates enrollment)
- Paystack + Flutterwave test-mode keys (stored securely in Supabase Vault)

## Deploy this in 3 steps

### 1. Install dependencies
```bash
npm install
```

### 2. Test it locally first
```bash
npm run dev
```
Open the printed local URL (usually http://localhost:5173) and confirm the
course catalog loads real data, sign-up works, and checkout redirects to
Paystack/Flutterwave's test payment page.

### 3. Deploy to Netlify
Easiest path — Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --build --prod
```
Follow the prompts to log in and create a new site. That's it — you'll get
a live `https://your-site-name.netlify.app` URL.

Alternative: push this folder to a GitHub repo, then in Netlify's dashboard
choose "Import from Git" and point it at the repo — Netlify will pick up
`netlify.toml` automatically and rebuild on every push.

## Still to do after this is live
- Add a custom domain (e.g. gsoldesignacademy.com) in Netlify's domain settings
- Switch Paystack/Flutterwave from test keys to live keys once ready to accept
  real payments (update the secrets in Supabase Vault, same process as before)
- Migrate lesson videos from Google Drive links to Vimeo for secure playback
- Update the webhook URLs in Paystack/Flutterwave dashboards if the function
  URLs ever change (they won't just from deploying this frontend — the
  backend is separate and already stable)
