# MENA Mastery — Registration Dashboard

A static, no-build dashboard tracking registrations for YPO MENA Mastery: totals,
chapter breakdowns by role, session attendance, and flags for chapters with zero
registrations. No individual names or emails are included — aggregate counts only.

## Structure

```
.
├── index.html          # page shell — loads styles.css, data.js, dashboard.js
├── src/
│   ├── styles.css      # all styling (light/dark aware)
│   ├── data.js         # the registration data, as a REGISTRANTS array
│   └── dashboard.js     # rendering logic (KPIs, bars, filters, table)
└── README.md
```

There's no build step, no npm install, no framework — it's plain HTML/CSS/JS. Open
`index.html` directly in a browser and it works, or deploy it as-is.

## Updating the data

Replace the contents of `src/data.js` with a new export in the same shape:

```js
const REGISTRANTS = [
  {
    "role": "Chapter Chair",
    "chapter": "YPO Dubai Integrated",
    "tshirt": "Men's Adult Large",
    "sessions": ["Welcome Social", "MENA Mastery Sessions"],
    "welcomeSpouse": "No",
    "whiteSpouse": "Yes"
  },
  ...
];
```

The chapter master list (used to flag chapters with zero registrations) lives near
the top of `src/dashboard.js` as `FULL_CHAPTER_LIST`. Update it there if the roster
of MENA chapters changes.

## Deploying on GitHub Pages

1. Push this folder to a GitHub repo (see steps below).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   **Branch** to `main`, folder to `/ (root)`.
4. Save. Your dashboard will be live at
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Pushing this repo from the command line

```bash
git init
git add .
git commit -m "Initial commit — MENA Mastery registration dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
