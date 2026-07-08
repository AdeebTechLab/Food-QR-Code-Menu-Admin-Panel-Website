# Admin Panel — Setup

This admin panel is fully static — no backend, no database, no Vercel dashboard access needed.
It edits `data/menu-data.json` directly via GitHub's API, using a personal access token you
create yourself. Your public site pages (`index.html`, `app.js`, etc.) are untouched and need
no changes.

## 1. Create your GitHub token

1. Log into github.com with your account (the one invited as a collaborator on this repo)
2. Profile picture (top right) → **Settings**
3. Left sidebar, scroll to the bottom → **Developer settings**
4. **Personal access tokens → Tokens (classic) → Generate new token → Generate new token (classic)**
5. **Note:** `menu-admin-panel`
6. **Expiration:** 90 days
7. **Select scopes:** check the top-level **`repo`** box (this covers everything needed)
8. Scroll down → **Generate token**
9. **Copy it immediately** (starts with `ghp_...`) — GitHub only shows it once

## 2. Log in

Go to:
```
https://qr-code-menu-mauve.vercel.app/admin/login.html
```

The repo owner, name, and branch fields are pre-filled. Paste your token in and click
**Unlock admin panel**.

## 3. Use it

- Every category and item from your real menu loads automatically
- Edit any title, description, price, badge, or image directly
- **Upload…** next to an item's image field uploads a photo straight to `/assets` in your repo
  and fills in the filename for you
- **+ Add item** / **+ Add category**, and **Delete item** / **Delete category** buttons handle
  the rest
- Nothing is written to GitHub until you click **Save changes** — that's the one commit
- Your public menu updates roughly 30–60 seconds after saving, once Vercel redeploys

## Security notes

- There's no separate username/password — the GitHub token **is** the credential. Anyone with
  a valid token that has write access to this repo can make changes, same as anyone who could
  `git push` directly.
- The token lives only in your browser's session storage — it's cleared when you close the tab,
  and it is never written into the repo or sent anywhere except GitHub's API.
- If a token ever leaks, revoke it immediately at **github.com/settings/tokens** and generate a
  new one.
- Don't log into the admin panel from a shared or public computer without clearing the browser
  session afterward.

## If you outgrow this

This file-based approach is fine for occasional menu updates. If you ever get access to a
proper backend (Vercel dashboard, or any other hosting with server functions + a database),
a database-backed version removes the "commit per save" model and is nicer for frequent edits —
just ask and it can be built when that access is available.
