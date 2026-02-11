# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OVAL (Opinion Visualization with Annotated Labels) is an experimental tool for visualizing public opinion data. Users upload CSV files of comments and vote matrices, annotate representative comments on a scale, and the system uses PCA + linear regression to score and visualize all comments along user-defined dimensions.

## Repository Structure

- `demo/oval/` — React/TypeScript frontend (Vite + Tailwind CSS)
- `server/` — FastAPI backend (Python, managed by uv)
- `data/` — Runtime data directory (gitignored), stores numpy arrays and scored CSVs

## Development Commands

```bash
make install       # Install frontend (npm) and backend (uv) dependencies
make dev           # Start both frontend and backend dev servers
make build         # TypeScript check + production build
make lint          # ESLint
```

Both servers must be running simultaneously (`make dev` handles this). The frontend hardcodes API calls to `http://localhost:8000`.

## Architecture

### Data Flow

1. **Upload** — User uploads two CSVs (comments + votes matrix) or a single h5ad file → `POST /load_data/`
2. **PCA** — Backend decomposes vote matrix into principal components (default 8), saves to `data/`
3. **Annotation** — Frontend presents representative comments (top 3 per component, shuffled), user rates each on a 1-5 scale
4. **Regression** — Ratings are sent to `POST /regress_variable/`, which fits a linear regression mapping PCA components to user scores
5. **Visualization** — `GET /visualize/{name}` returns 2D scatter data colored by predicted scores; `GET /comments/{name}` returns all comments with normalized scores (z-scores)

### Frontend Component Hierarchy

`App` manages all state and passes props down through `AppShell`, which renders a 3-panel layout (sidebar, canvas, analysis). The sidebar cycles through phases: `UploadFiles` → variable name input → `MakeVariable` (annotation). The canvas shows a `ScatterPlot` (D3.js). The analysis panel shows `AnalysisPanel` with color-coded scored comments.

### Backend

`server/main.py` is a single-file FastAPI app. Key functions: `decompose_votes()` (PCA), `process_csv()` (ETL), `regress_variable_from_comment_mapping()` (regression), `score_and_save_comments()` (scoring + persistence). State is persisted as files in `data/` — numpy arrays for reduced matrices and models, CSVs for comments.

### Key Conventions

- Variable names from user input are converted to snake_case via `variableNameToSnakeCase()` before API calls
- CSV files are identified by filename: "comments" in name → comments CSV, "votes" in name → votes matrix
- Scores are normalized to z-scores (mean/std) before display
- No tests or CI currently exist
