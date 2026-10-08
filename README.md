# ROS 2 Basics Lab

Designed for the ROS 2 exercise session at Diepenbeek. A static browser workstation with seven lessons, Python and C++ learning paths, English/French/Dutch, and light/dark themes.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:8017/ros2-basics-lab/ . Python and the C++ toolchain download lazily; internet access is required for their first use. Lesson 1 needs neither runtime. Workspaces, installed packages, terminal environments and lesson progress autosave in this browser; Save session also saves immediately. Processes must be restarted after reopening. Course and playground workspaces are separate. Export sources for a portable backup; browser storage is local to this site and browser profile. Language, theme and layout preferences persist locally.

## Validate

```sh
npm test
npm run build
npm run test:browser
```

The browser suite uses Google Chrome at `google-chrome`. With `npm run dev` running, test the visible course and preferences:

```sh
npm run test:acceptance
LAB_LANGUAGE=cpp npm run test:acceptance
npm run test:preferences
node scripts/topics-lesson-check.mjs
```

Set `LAB_URL` to test the same UI against another local server. To check the built site, run `npm run preview` instead of the development server. Tests write screenshots and acceptance results under ignored `artifacts/`.

## Static hosting

`npm run build` writes `dist/`. Serve its contents at `/ros2-basics-lab/` (including `src/` and its workers). All application assets use relative URLs. HTTPS is needed for browser clipboard access on public hosting. GitHub Pages can serve the artifact without a backend. This repository is local; no remote repository or deployment is configured.

## Teaching model

Files → package metadata → build → install → sourced terminal → process → shared graph.

The shell, colcon/ament, CMake subset, ROS CLI and graph are modeled. Python runs in real CPython/Pyodide; C++ is compiled by Clang/LLD to WebAssembly. This is not native Linux or DDS/RMW. See [supported behavior and native handoff](docs/HANDOFF.md), [architecture](docs/ARCHITECTURE.md), and [local checkpoint](docs/CHECKPOINT.md).

Source provenance and required license notices are retained in LICENSE, NOTICE and docs/EXTRACTION.json.

## Public colleague preview

The first review deployment is [ROS 2 Basics Lab on GitHub Pages](https://mariomlz99.github.io/ros2-basics-lab/). The [public deployment repository](https://github.com/mariomlz99/ros2-basics-lab) contains generated static files. Development source and internal checkpoints remain in this workspace.

`npm run build:public` generates the public artifact in `dist/`, excluding university logos and internal checkpoint/extraction notes. Publishing is a separate Git push to the deployment repository. The public build includes `build-info.json` with its source revision. Do not publish the ordinary development build instead.

Browser checks accept `LAB_URL=https://mariomlz99.github.io/ros2-basics-lab/`; pass `--public` to the preferences check for the logo-free site. Browser sessions are scoped to their host, so localhost saves do not automatically transfer to the public URL.

Lesson 3, **Talking ROS 2: Topics & Terminals**, introduces String and Twist messages before publisher/subscriber coding. It covers continuous, one-shot and fixed-count publishing, rates, matching subscribers, Ctrl+C and default volatile delivery. Compare the exercise with native Jazzy using `source /opt/ros/jazzy/setup.bash; python3 scripts/native-topics-check.py`.

Terminal completion follows the default Bash interaction: Tab completes an unambiguous prefix; a second Tab displays sorted matches in vertical columns. Lists of 100 or more matches ask `Display all N possibilities? (y or n)`. Long lists use `--More--` (Space for a page, Enter for one line, q to stop); declining or quitting preserves the command. Browser check: `node scripts/completion-check.mjs` (`LAB_URL` selects another local server).
