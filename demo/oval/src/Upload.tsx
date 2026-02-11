import { useRef, useState } from 'react';
import { loadH5adFile, toCSVBlobs } from './lib/h5ad-loader';

export interface Comment {
  'comment-id': number;
  'comment-body': string;
}

export interface LoadedData {
  reduced_shape: number[];
  comments: Comment[];
  votes_matrix_shape: number[];
}

const loadDataApi = async (files: File[]) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const response = await fetch('http://localhost:8000/load_data', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to load data');
  }

  return response.json() as Promise<LoadedData>;
};

function isH5adFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.h5ad') || name.endsWith('.h5');
}

export default function UploadFiles({ onFinish }: { onFinish: (data: LoadedData) => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleButtonClick = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    setLoading(true);
    try {
      let files: File[];

      // Check if a single h5ad file was selected
      if (selectedFiles.length === 1 && isH5adFile(selectedFiles[0])) {
        const h5adFile = selectedFiles[0];
        const buffer = await h5adFile.arrayBuffer();
        const parsed = await loadH5adFile(buffer);
        const { commentsBlob, votesBlob } = toCSVBlobs(parsed);

        files = [
          new File([commentsBlob], 'comments.csv', { type: 'text/csv' }),
          new File([votesBlob], 'votes.csv', { type: 'text/csv' }),
        ];
      } else {
        files = Array.from(selectedFiles);
      }

      const data = await loadDataApi(files);
      onFinish(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center p-4">
      <p className="mb-4 text-slate-600">Upload Pol.is archive or h5ad file.</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.h5ad,.h5"
        multiple
        className="mb-4"
      />
      <button
        onClick={handleButtonClick}
        disabled={loading}
        className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50">
        {loading ? 'Processing...' : 'Load Files'}
      </button>
    </div>
  );
}
