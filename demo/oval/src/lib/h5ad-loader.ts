import type { Group, Dataset, File as H5File } from 'h5wasm';
import h5wasm from 'h5wasm';

export type H5adParsed = {
  comments: { id: string; body: string }[];
  participantIds: string[];
  commentIds: string[];
  votesMatrix: (number | null)[][];
  embeddings: Record<string, number[][]>;
};

/**
 * Read the index (row/column names) from an AnnData group (obs or var).
 * AnnData stores the index column name in the `_index` attribute of the group,
 * then stores the actual values as a dataset with that name.
 */
function readIndex(group: Group): string[] {
  let indexDatasetName = '_index';
  try {
    const indexAttr = group.get_attribute('_index', true);
    if (typeof indexAttr === 'string') {
      indexDatasetName = indexAttr;
    }
  } catch {
    // Fall back to '_index' dataset name
  }

  const indexDataset = group.get(indexDatasetName);
  if (indexDataset && 'json_value' in indexDataset) {
    const val = (indexDataset as Dataset).json_value;
    if (Array.isArray(val)) {
      return val.map(String);
    }
  }

  throw new Error(`Could not read index from group at ${group.path}`);
}

/**
 * Read a column from an AnnData DataFrame group (obs or var).
 * Handles both plain datasets and categorical columns (stored as groups with codes + categories).
 */
function readColumn(parentGroup: Group, name: string): (string | number)[] {
  const item = parentGroup.get(name);
  if (!item) {
    throw new Error(`Column "${name}" not found in ${parentGroup.path}`);
  }

  // Categorical column: stored as a Group with `codes` and `categories` sub-datasets
  if ('keys' in item && typeof (item as Group).keys === 'function') {
    const asGroup = item as Group;
    const groupKeys = asGroup.keys();
    if (groupKeys.includes('codes') && groupKeys.includes('categories')) {
      const codesDs = asGroup.get('codes') as Dataset | null;
      const categoriesDs = asGroup.get('categories') as Dataset | null;
      if (!codesDs || !categoriesDs) {
        throw new Error(`Categorical column "${name}" missing codes or categories`);
      }
      const codes = codesDs.json_value;
      const categories = categoriesDs.json_value;
      if (!Array.isArray(codes) || !Array.isArray(categories)) {
        throw new Error(`Unexpected format for categorical column "${name}"`);
      }
      return (codes as number[]).map((code) => {
        if (code < 0) return '';
        return categories[code] as string | number;
      });
    }
  }

  // Plain dataset
  if ('json_value' in item) {
    const val = (item as Dataset).json_value;
    if (Array.isArray(val)) {
      return val as (string | number)[];
    }
  }

  throw new Error(`Could not read column "${name}" from ${parentGroup.path}`);
}

/**
 * Parse an h5ad (AnnData) file buffer into oval-compatible data structures.
 *
 * Reads .X as the votes matrix (n_participants × n_statements),
 * .obs_names as participant IDs, .var_names as comment IDs,
 * and .var['content'] as comment text.
 */
export async function loadH5adFile(buffer: ArrayBuffer): Promise<H5adParsed> {
  const { FS } = await h5wasm.ready;

  const filename = 'upload.h5ad';
  FS.writeFile(filename, new Uint8Array(buffer));

  const { File } = await import('h5wasm');

  let file: H5File | null = null;
  try {
    file = new File(filename, 'r');

    // Read obs_names (participant IDs)
    const obsGroup = file.get('obs') as Group;
    if (!obsGroup) throw new Error('Missing /obs group');
    const participantIds = readIndex(obsGroup);

    // Read var_names (comment IDs) and comment text
    const varGroup = file.get('var') as Group;
    if (!varGroup) throw new Error('Missing /var group');
    const commentIds = readIndex(varGroup);

    const varKeys = varGroup.keys();
    let commentTexts: (string | number)[];
    if (varKeys.includes('content')) {
      commentTexts = readColumn(varGroup, 'content');
    } else if (varKeys.includes('txt')) {
      commentTexts = readColumn(varGroup, 'txt');
    } else {
      commentTexts = commentIds.map(() => '');
    }

    const comments = commentIds.map((id, i) => ({
      id,
      body: String(commentTexts[i]),
    }));

    // Read .X (votes matrix, shape: n_obs × n_var)
    const xDataset = file.get('X') as Dataset | null;
    if (!xDataset) throw new Error('Missing /X dataset');

    const shape = xDataset.shape;
    if (!shape || shape.length !== 2) {
      throw new Error(`Expected 2D matrix for /X, got shape: ${shape}`);
    }

    const nObs = shape[0];
    const nVar = shape[1];
    const rawValue = xDataset.value;

    let flat: number[];
    if (ArrayBuffer.isView(rawValue)) {
      flat = Array.from(rawValue as Float64Array | Float32Array);
    } else if (Array.isArray(rawValue)) {
      flat = (rawValue as number[][]).flat();
    } else {
      throw new Error('Unexpected format for /X dataset');
    }

    // Convert flat array to 2D, preserving NaN as null
    const votesMatrix: (number | null)[][] = [];
    for (let i = 0; i < nObs; i++) {
      const row: (number | null)[] = [];
      for (let j = 0; j < nVar; j++) {
        const val = flat[i * nVar + j];
        row.push(isNaN(val) ? null : val);
      }
      votesMatrix.push(row);
    }

    // Read .obsm embeddings (UMAP, t-SNE, etc.)
    const embeddings: Record<string, number[][]> = {};
    try {
      const obsmGroup = file.get('obsm') as Group | null;
      if (obsmGroup) {
        for (const key of obsmGroup.keys()) {
          try {
            const ds = obsmGroup.get(key);
            if (!ds || !('shape' in ds)) continue;
            const dataset = ds as Dataset;
            const dsShape = dataset.shape;
            if (!dsShape || dsShape.length !== 2 || dsShape[0] !== nObs || dsShape[1] < 2) continue;

            const rawEmb = dataset.value;
            let flatEmb: number[];
            if (ArrayBuffer.isView(rawEmb)) {
              flatEmb = Array.from(rawEmb as Float64Array | Float32Array);
            } else if (Array.isArray(rawEmb)) {
              flatEmb = (rawEmb as number[][]).flat();
            } else {
              continue;
            }

            const cols = dsShape[1];
            const points: number[][] = [];
            for (let i = 0; i < nObs; i++) {
              points.push([flatEmb[i * cols], flatEmb[i * cols + 1]]);
            }
            embeddings[key] = points;
          } catch {
            // Skip unreadable entries (sparse matrices, etc.)
          }
        }
      }
    } catch {
      // No obsm group or unreadable — continue without embeddings
    }

    return { comments, participantIds, commentIds, votesMatrix, embeddings };
  } finally {
    if (file) {
      file.close();
    }
    try {
      FS.unlink(filename);
    } catch {
      // ignore cleanup errors
    }
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert parsed h5ad data into two CSV Blobs matching oval's expected format.
 *
 * Comments CSV: comment-id,comment-body
 * Votes matrix CSV: participant,{id1},{id2},...
 */
export function toCSVBlobs(data: H5adParsed): {
  commentsBlob: Blob;
  votesBlob: Blob;
} {
  // Build comments CSV
  const commentsLines = ['comment-id,comment-body'];
  for (const c of data.comments) {
    commentsLines.push(`${escapeCSV(c.id)},${escapeCSV(c.body)}`);
  }
  const commentsBlob = new Blob([commentsLines.join('\n')], {
    type: 'text/csv',
  });

  // Build votes matrix CSV
  const header = ['participant', ...data.commentIds.map(escapeCSV)].join(',');
  const votesLines = [header];
  for (let i = 0; i < data.participantIds.length; i++) {
    const cells = [escapeCSV(data.participantIds[i])];
    for (let j = 0; j < data.commentIds.length; j++) {
      const val = data.votesMatrix[i][j];
      cells.push(val === null ? '' : String(val));
    }
    votesLines.push(cells.join(','));
  }
  const votesBlob = new Blob([votesLines.join('\n')], { type: 'text/csv' });

  return { commentsBlob, votesBlob };
}
