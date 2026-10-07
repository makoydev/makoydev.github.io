# makoydev.github.io

Static pages for the AI Governance Toolkit, served by GitHub Pages at <https://makoydev.github.io>.

| Path | What it is |
|---|---|
| [`/vetted/`](https://makoydev.github.io/vetted/) | Vetted, in plain words: an animated explainer for non-technical readers |
| [`/discreet/film/`](https://makoydev.github.io/discreet/film/) | A 30-second film of Discreet: a message crosses the Discreet wall, personal data turns into placeholders and back, an eligibility decision is refused, and a tampered audit log is caught. Built by `tools/film/discreet/` |
| [`/vetted/film/`](https://makoydev.github.io/vetted/film/) | A 30-second motion-graphics film with a 120 BPM soundtrack telling the same story. Picture and soundtrack are generated from code by `tools/film/` (`npm run build`); every label was checked against the real engine |
| [`/vetted/try/`](https://makoydev.github.io/vetted/try/) | Try Vetted live: drag fake secrets, NRICs and tricks into a code change and watch Vetted's real v0.1.0 rules protect it, in the browser. Built by `tools/try/build.sh`; the page cannot connect anywhere (`connect-src 'none'`) |
| [`/discreet/m2-review/`](https://makoydev.github.io/discreet/m2-review/) | Milestone 2 decision report: Discreet v0.1 (what was built, the evidence, 13 decisions, every AI mistake, Michael's steps) |
| [`/vetted/m1-review/`](https://makoydev.github.io/vetted/m1-review/) | Milestone 1 decision report: what was built, the decisions and evidence, every AI mistake, and what was left out |
| `/` | Redirects to `/vetted/` until the toolkit landing page ships (Milestone 3) |

Each page is a single self-contained HTML file. Only `/vetted/try/` has a build step, which bundles Vetted's real detection code from a release tag. Fonts load from Google Fonts and fall back to system fonts offline.

Every change goes through a pull request. Project board: <https://github.com/users/makoydev/projects/1>
