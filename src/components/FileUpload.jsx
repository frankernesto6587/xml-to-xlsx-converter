import { useState, useCallback } from 'react';

export default function FileUpload({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const processFile = (file) => {
    const isXML = file.name.toLowerCase().endsWith('.xml');
    const isZIP = file.name.toLowerCase().endsWith('.zip');

    if (!isXML && !isZIP) {
      alert('Por favor selecciona un archivo XML o ZIP');
      return;
    }

    setFileName(file.name);

    // Pass the file object directly to parent
    // Parent will handle ZIP extraction if needed
    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${isDragging
            ? 'border-cyan-400 bg-cyan-900/20 scale-105 shadow-lg shadow-cyan-500/20'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className={`w-16 h-16 transition-colors ${isDragging ? 'text-cyan-400' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-200">
              Arrastra tu archivo XML o ZIP aquí
            </p>
            <p className="text-sm text-gray-400 mt-1">
              o haz clic para seleccionar
            </p>
          </div>

          <input
            type="file"
            accept=".xml,.zip"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />

          <label
            htmlFor="file-input"
            className="inline-block px-6 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-500 transition-colors shadow-lg"
          >
            Seleccionar Archivo
          </label>

          {fileName && (
            <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-sm text-green-200">
                <span className="font-medium">Archivo seleccionado:</span> {fileName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
