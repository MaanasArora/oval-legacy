# OVAL

**Opinion Visualization with Annotated Labels** — an experimental tool for visualizing public opinion data.

Users upload CSV files of comments and vote matrices, annotate representative comments on a scale, and the system uses PCA + linear regression to score and visualize all comments along user-defined dimensions.

## Getting Started

### Prerequisites

- Node.js
- Python 3 with pip

### Backend

<!-- WIP: Setup instructions coming in another PR. -->

### Frontend

```bash
cd demo/oval
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` (default Vite port).

Both servers must be running simultaneously.

## How It Works

1. **Upload** — Upload two CSVs: one with comments, one with a vote matrix.
2. **PCA** — The backend decomposes the vote matrix into principal components.
3. **Annotate** — Rate representative comments on a 1-5 scale to define a dimension.
4. **Regress** — A linear regression maps PCA components to your ratings.
5. **Visualize** — View a 2D scatter plot of all comments, colored by predicted scores.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, D3.js
- **Backend:** Python, FastAPI, NumPy, scikit-learn

## License

See [LICENSE](LICENSE) for details.
