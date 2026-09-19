# My deployment

I edit the website directly in this GitHub repository, with `index.html` at the root. I run `node build.cjs` to check local assets and JavaScript syntax. This command only checks files; it does not create a `dist` folder or copy the website.

I keep local tools and private files out of the published website:

- `.git`, `.openai`, and `.gitignore`
- `output` and `tests`
- `preview.cjs`, `build.cjs`, `pillar.js`, and `tris.js`
- `BLENDER_MODEL.md`, `DEPLOY.md`, and unreferenced artwork such as `logo.svg`
- Any `.env` files, logs, backups, or source archives

I commit `content.js`, both stylesheets, `main.js`, `terminal.js`, all five HTML pages, referenced artwork/models, music models and audio files, and the font files with their license. Both stylesheets still support the site; I do not delete either one.

I add each soundtrack model under `music[].model` and its songs under `music[].tracks` in `content.js`. Each track has a `title` and an `audio` file path. Empty fields leave a clean slot ready for me to fill later.

I keep `CNAME` while using `k4yn.com` on a host that uses that file. I change it if I change my custom domain.

I keep only the public Supabase key in `content.js`. I verify my database access policies separately; this build cannot verify them. My model viewer and YouTube embeds also need an internet connection.

Before publishing, I open Home, Contact, About, Games, and Logs; select both games; open their galleries and details; and check the Windows and Linux download links. I check the header video and the terminal on a narrow screen too.

I commit and push my changes through my existing GitHub workflow. The local checker does not commit, push, or publish anything.
