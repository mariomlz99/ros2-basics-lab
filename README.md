# ROS 2 Basics Lab

Designed for the ROS 2 exercise session at Diepenbeek. A static browser workstation with six lessons, Python and C++ learning paths, English/French/Dutch, and light/dark themes.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:8017/ros2-basics-lab/ . Python and the C++ toolchain download lazily; internet access is required for their first use. Lesson 1 needs neither runtime. Learner files live in memory: export your workspace before reloading. Language and theme preferences persist locally.

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
```

Set `LAB_URL` to test the same UI against another local server. To check the built site, run `npm run preview` instead of the development server. Tests write screenshots and acceptance results under ignored `artifacts/`.

## Static hosting

`npm run build` writes `dist/`. Serve its contents at `/ros2-basics-lab/` (including `src/` and its workers). All application assets use relative URLs. HTTPS is needed for browser clipboard access on public hosting. GitHub Pages can serve the artifact without a backend. This repository is local; no remote repository or deployment is configured.

## Teaching model

Files → package metadata → build → install → sourced terminal → process → shared graph.

The shell, colcon/ament, CMake subset, ROS CLI and graph are modeled. Python runs in real CPython/Pyodide; C++ is compiled by Clang/LLD to WebAssembly. This is not native Linux or DDS/RMW. See [supported behavior and native handoff](docs/HANDOFF.md), [architecture](docs/ARCHITECTURE.md), and [local checkpoint](docs/CHECKPOINT.md).

Source provenance and required license notices are retained in LICENSE, NOTICE and docs/EXTRACTION.json.
