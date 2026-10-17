import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { submissionsApi } from '../api/submissions';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt'];
const MAX_FILE_SIZE_MB = 10;
const MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const UploadModal = ({ isOpen, onClose, onSuccess, isReplacement = false, currentVersion = 1 }) => {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validateFile = (selectedFile) => {
    setErrorMsg('');
    if (!selectedFile) return false;

    if (selectedFile.size > MAX_BYTES) {
      setErrorMsg(`File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB} MB.`);
      return false;
    }

    const parts = selectedFile.name.split('.');
    const ext = parts[parts.length - 1].toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg(`Invalid file type .${ext}. Only PDF, DOC, DOCX, and TXT files are accepted.`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && validateFile(selected)) {
      setFile(selected);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (validateFile(dropped)) {
        setFile(dropped);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a log sheet file to upload.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('file', file);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const res = await submissionsApi.uploadSubmission(formData, (progress) => {
        setUploadProgress(progress);
      });

      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        onSuccess(res);
        onClose();
      }, 500);
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      const msg = err.response?.data?.detail || 'Failed to upload log sheet. Please try again.';
      setErrorMsg(msg);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isReplacement ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'}`}>
              {isReplacement ? <RefreshCw className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isReplacement ? `Replace Log Sheet (Version ${currentVersion + 1})` : 'Upload Daily Log Sheet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isReplacement 
                  ? 'Your previous submission will be securely archived in your version history.' 
                  : 'Submit your completed daily activity sheet before the deadline.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : file
                ? 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20'
                : 'border-slate-200 hover:border-blue-400 dark:border-slate-700 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />

            {file ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[220px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {formatFileSize(file.size)} &bull; {file.name.split('.').pop()?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Click to browse
                  </span>{' '}
                  or drag and drop your file here
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT (Max {MAX_FILE_SIZE_MB}MB)
                </p>
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Notes / Summary (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief summary of activities completed today..."
              rows={2}
              disabled={uploading}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white transition-all resize-none"
            />
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                <span>Uploading and validating file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isReplacement ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Confirm Replacement</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Log Sheet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
