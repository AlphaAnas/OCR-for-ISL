import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface OCRResult {
  [key: string]: any;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const selectedFile = files[0];
    
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid invoice file (PDF, JPG, PNG)');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid invoice file (PDF, JPG, PNG)');
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    return validTypes.includes(file.type);
  };

  const processInvoice = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Replace with your actual Flask API endpoint
      const response = await fetch('https://ocr-for-isl.onrender.com/parse-invoice-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process invoice');
      }

      const result = await response.json();
      setOcrResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setFile(null);
    setOcrResult(null);
    setError(null);
    setIsLoading(false);
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic text-sm">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className={value ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{value.toString()}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-600 font-medium">{value.toLocaleString()}</span>;
    }
    
    if (typeof value === 'string') {
      return <span className="text-gray-800 break-words">{value}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="ml-2 mt-1">
          <div className="text-xs text-gray-500 mb-1">Array ({value.length} items)</div>
          {value.map((item, index) => (
            <div key={index} className="border-l-2 border-blue-200 pl-3 py-1 ml-2">
              <div className="flex items-start gap-2">
                <span className="text-xs text-blue-600 font-mono bg-blue-50 px-1 rounded">[{index}]</span>
                <div className="flex-1">{renderValue(item)}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <div className="ml-2 mt-1">
          <div className="text-xs text-gray-500 mb-1">Object ({Object.keys(value).length} properties)</div>
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="border-l-2 border-indigo-200 pl-3 py-2 ml-2">
              <div className="flex items-start gap-2">
                <span className="font-medium text-indigo-700 min-w-0 font-mono text-sm bg-indigo-50 px-2 py-0.5 rounded">
                  {key}:
                </span>
                <div className="min-w-0 flex-1">{renderValue(val)}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Invoice OCR Processor</h1>
          <p className="text-lg text-gray-600">Upload your invoice and extract data with OCR technology</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Upload size={24} />
              Upload Invoice
            </h2>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <FileText size={48} className="mx-auto text-blue-600" />
                  <div>
                    <p className="text-lg font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={processInvoice}
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Process Invoice'
                      )}
                    </button>
                    <button
                      onClick={resetApp}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload size={48} className="mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Drag and drop your invoice here
                    </p>
                    <p className="text-sm text-gray-500">or click to browse files</p>
                  </div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-gray-400">Supported formats: PDF, JPG, PNG</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          {ocrResult && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle size={24} className="text-green-600" />
                  OCR Results
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(ocrResult, null, 2));
                      // You could add a toast notification here
                    }}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(ocrResult, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'invoice-ocr-results.json';
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 max-h-[600px] overflow-auto border">
                <div className="space-y-3">
                  {Object.entries(ocrResult).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-mono px-3 py-1 rounded-full">
                            {key}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mt-1">{renderValue(value)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON View Toggle */}
              <div className="mt-6">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2">
                    <span className="transform group-open:rotate-90 transition-transform">▶</span>
                    View Raw JSON
                  </summary>
                  <div className="mt-3 bg-gray-900 rounded-lg p-4 overflow-auto max-h-64">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(ocrResult, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Connected to Flask API at <code className="bg-gray-200 px-2 py-1 rounded">https://ocr-for-isl.onrender.com/</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;