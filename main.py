from pathlib import Path
import numpy as np
import pandas
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression
from scipy.ndimage import gaussian_filter
from matplotlib import pyplot as plt
from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import create_engine


random_state = 42


def decompose_votes(
    vote_matrix: np.ndarray, random_state: int = random_state, num_components: int = 2
):
    pca = PCA(
        n_components=num_components,
        random_state=random_state,
    )

    vote_matrix_nonan = np.nan_to_num(vote_matrix, nan=0)
    transformed = pca.fit_transform(vote_matrix_nonan)

    total_votes = np.sum(~np.isnan(vote_matrix_nonan), axis=1)
    vote_scale = np.sum(~np.isnan(vote_matrix_nonan), axis=1)
    vote_scale = np.sqrt(total_votes / (vote_scale + 1e-10))

    return transformed * vote_scale[:, None], pca


def process_csv(
    comments_csv: Path, votes_matrix_csv: Path, random_state: int, num_components: int
):
    content_df = pandas.read_csv(comments_csv)
    votes_matrix_df = pandas.read_csv(votes_matrix_csv)

    comments = content_df.set_index("comment-id")["comment-body"]

    comment_ids = content_df["comment-id"].astype(str).tolist()
    votes_matrix = votes_matrix_df.set_index("participant")[comment_ids]
    votes_matrix = votes_matrix.values

    votes_matrix_nonan = np.nan_to_num(votes_matrix, nan=0)

    reduced, model = decompose_votes(
        votes_matrix_nonan, random_state=random_state, num_components=num_components
    )
    reduced_2d, model_2d = decompose_votes(
        votes_matrix_nonan, random_state=random_state, num_components=2
    )

    comment_projections = model.components_.T
    comment_projections = pandas.DataFrame(
        comment_projections,
        index=content_df["comment-id"],
        columns=[f"component_{i+1}" for i in range(comment_projections.shape[1])],
    )
    comments = pandas.DataFrame(comments).join(comment_projections)

    return reduced, comments, votes_matrix, model, reduced_2d, model_2d


def save_reduced(reduced: np.ndarray, report_dir: Path, filename: str = "reduced.npy"):
    if not report_dir.exists():
        report_dir.mkdir(parents=True)

    np.save(report_dir / filename, reduced)


def save_comments(
    comments: pandas.DataFrame, report_dir: Path, filename: str = "comments.csv"
):
    if not report_dir.exists():
        report_dir.mkdir(parents=True)

    comments.to_csv(report_dir / filename, index=True)


def regress_variable(reduced: np.ndarray, variable: np.ndarray):
    model = LinearRegression(fit_intercept=False)
    model.fit(reduced, variable)
    r_squared = model.score(reduced, variable)
    return model, r_squared


def regress_variable_from_comment_mapping(
    comments: pandas.DataFrame,
    comment_ids: list[int],
    scores: np.ndarray,
):
    included_comments = comments.loc[comment_ids]
    reduced = included_comments.iloc[:, 1:].values
    model, r_squared = regress_variable(reduced, scores)
    return model, r_squared


def score_and_save_comments(
    comments: pandas.DataFrame,
    model: LinearRegression,
    report_dir: Path,
    filename: str = "scored_comments.csv",
):
    scores = model.predict(comments.iloc[:, 1:].values)
    scored_comments = comments.reset_index()
    scored_comments["score"] = scores

    scored_comments = scored_comments.sort_values(by="score", ascending=False)

    if not report_dir.exists():
        report_dir.mkdir(parents=True)

    scored_comments.to_csv(report_dir / filename, index=False)


def save_model(model, report_dir: Path, filename: str = "regression_model.npy"):
    if not report_dir.exists():
        report_dir.mkdir(parents=True)

    np.save(report_dir / filename, model)


app = FastAPI()

engine = create_engine("sqlite:///./test.db")


class LoadDataRequest(BaseModel):
    comments_csv: Path
    votes_matrix_csv: Path
    random_state: int = 42
    num_components: int = 8


class CommentVariableMapping(BaseModel):
    comment_id: int
    score: float


class RegressVariableRequest(BaseModel):
    variable_name: str
    mappings: list[CommentVariableMapping]


@app.post("/load_data/")
def load_data(request: LoadDataRequest):
    reduced, comments, votes_matrix, _, reduced_2d, _ = process_csv(
        request.comments_csv,
        request.votes_matrix_csv,
        request.random_state,
        request.num_components,
    )

    save_reduced(reduced, report_dir=Path("data/"), filename="reduced.npy")
    save_reduced(reduced_2d, report_dir=Path("data/"), filename="reduced_2d.npy")
    save_comments(comments, report_dir=Path("data/"), filename="comments.csv")

    return {
        "reduced_shape": reduced.shape,
        "num_comments": len(comments),
        "votes_matrix_shape": votes_matrix.shape,
    }


@app.post("/regress_variable/")
def regress_variable_endpoint(request: RegressVariableRequest):
    mappings = request.mappings
    reduced = np.load(Path("data/reduced.npy"))
    comments = pandas.read_csv(Path("data/comments.csv")).set_index("comment-id")

    comment_ids = [mapping.comment_id for mapping in mappings]
    scores = [mapping.score for mapping in mappings]

    model, r_squared = regress_variable_from_comment_mapping(
        comments, comment_ids, np.array(scores)
    )

    save_model(
        np.array(model.coef_ + [model.intercept_]),
        report_dir=Path("data/") / request.variable_name,
        filename="regression_model.npy",
    )
    score_and_save_comments(
        comments,
        model,
        report_dir=Path("data/") / request.variable_name,
        filename="scored_comments.csv",
    )

    return {
        "r_squared": r_squared if not np.isnan(r_squared) else None,
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_,
    }


@app.get("/comments/{variable_name}")
def get_scored_comments(variable_name: str):
    scored_comments = pandas.read_csv(
        Path("data/") / variable_name / "scored_comments.csv"
    )
    return scored_comments.to_dict(orient="records")


@app.get("/visualize/{variable_name}")
def visualize_variable(variable_name: str):
    reduced = np.load(Path("data/reduced.npy"))
    reduced_2d = np.load(Path("data/reduced_2d.npy"))
    model = np.load(Path("data/") / variable_name / "regression_model.npy")

    participant_scores = reduced @ model

    plt.figure(figsize=(10, 8))

    heatmap, xedges, yedges = np.histogram2d(
        reduced_2d[:, 0], reduced_2d[:, 1], bins=30, weights=participant_scores
    )
    heatmap = gaussian_filter(heatmap, sigma=3)

    heatmap = heatmap.T
    heatmap /= np.abs(heatmap.sum()) + 1e-10

    extent = [xedges[0], xedges[-1], yedges[0], yedges[-1]]
    plt.imshow(
        heatmap,
        extent=extent,
        origin="lower",
        cmap="viridis",
        alpha=0.5,
        aspect="auto",
    )

    scatter = plt.scatter(
        reduced_2d[:, 0],
        reduced_2d[:, 1],
        c=participant_scores,
        cmap="viridis",
        s=100,
        edgecolor="k",
    )
    plt.colorbar(scatter, label="Participant Scores")

    plt.title(f"Participant Distribution Colored by {variable_name} Scores")
    plt.xlabel("Component 1")
    plt.ylabel("Component 2")
    plt.grid(True)

    plt.savefig(Path("data/") / variable_name / "visualization.png")

    return {"message": "Visualization saved."}