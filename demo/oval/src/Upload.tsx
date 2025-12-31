import { useRef, useState } from 'react';

export interface Comment {
  'comment-id': number;
  'comment-body': string;
}

export interface LoadedData {
  reduced_shape: number[];
  comments: Comment[];
  votes_matrix_shape: number[];
}

const loadDataApi = async (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('http://localhost:8000/load_data', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to load data');
  }

  return response.json() as Promise<LoadedData>;
};

export default function UploadFiles({ onFinish }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleButtonClick = () => {
    if (selectedFiles) {
      loadDataApi(selectedFiles)
        .then((data) => {
          onFinish(data);
        })
        .catch((error) => {
          console.error('Error loading data:', error);
        });
    } else {
      alert('Please select files to upload.');
    }
  };

  return (
    <div className="flex flex-col justify-center p-4">
      <p className="mb-4 text-slate-600">Upload Pol.is archive.</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="mb-4"
      />
      <button
        onClick={handleButtonClick}
        className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
        Load Files
      </button>
    </div>
  );
}
