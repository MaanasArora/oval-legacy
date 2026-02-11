# OVAL

**Opinion Visualization with Annotated Labels** — an experimental tool for visualizing public opinion data.

Users upload CSV files of comments and vote matrices (or a single [h5ad](https://anndata.readthedocs.io/) file), annotate representative comments on a scale, and the system uses PCA + linear regression to score and visualize all comments along user-defined dimensions.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [uv](https://docs.astral.sh/uv/) (Python package manager)

## Quickstart

```bash
make install   # Install frontend and backend dependencies
make dev       # Start both dev servers
```

The frontend runs at http://localhost:5173 and the backend at http://localhost:8000.

## Available Commands

```
make install   Install all dependencies
make dev       Start both frontend and backend dev servers
make build     Build frontend for production
make lint      Lint frontend code
```

## Data Formats

### CSV (Pol.is export)

Upload two files:
- **Comments CSV** — must contain `comment-id` and `comment-body` columns
- **Votes matrix CSV** — must contain a `participant` column, with remaining columns as comment IDs and values as votes

### h5ad (AnnData)

Upload a single `.h5ad` file following the [valency-anndata](https://github.com/patcon/valency-anndata) data model:
- `.X` — votes matrix (participants x statements), values `{-1, +1, NaN}`
- `.var['content']` — statement/comment text

The h5ad file is parsed client-side and converted to the CSV format automatically.

## Architecture

- `demo/oval/` — React/TypeScript frontend (Vite + Tailwind CSS)
- `server/` — FastAPI backend (PCA, regression, scoring)
- `data/` — Runtime data directory (gitignored)

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.
