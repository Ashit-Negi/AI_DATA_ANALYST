import React, { useState } from "react";

function UploadBox({ onUpload }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  //  allowed types
  const allowedTypes = [".csv", ".xlsx", ".xls", ".pdf"];

  const isValidFile = (fileName) => {
    return allowedTypes.some((type) => fileName.toLowerCase().endsWith(type));
  };

  const handleFile = (selected) => {
    if (!selected) return;

    if (isValidFile(selected.name)) {
      setFile(selected);
      setError("");
    } else {
      setFile(null);
      setError(" Only CSV, Excel, or PDF allowed");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`relative border border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
      ${
        dragActive
          ? "border-blue-500 bg-blue-500/10 scale-105"
          : "border-slate-600 bg-white/5 backdrop-blur-md hover:border-blue-400 hover:bg-white/10"
      }`}
    >
      {/* ICON */}
      <div className="text-5xl mb-4 animate-bounce"></div>

      {/* TITLE */}
      <p className="text-lg text-slate-300 font-semibold">
        Upload your dataset
      </p>

      <p className="text-sm text-slate-400 mt-1">
        CSV, Excel (.xlsx), or PDF supported
      </p>

      {/* INPUT */}
      <label className="block mt-5 cursor-pointer text-blue-400 underline hover:text-blue-300">
        Browse File
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />
      </label>

      {/* FILE PREVIEW */}
      {file && (
        <div className="mt-4 text-sm text-green-400 bg-green-400/10 px-3 py-2 rounded-lg inline-block">
          {file.name}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mt-4 text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg inline-block">
          {error}
        </div>
      )}

      {/* BUTTON */}
      {file && (
        <button
          onClick={() => onUpload(file)}
          className="mt-6 bg-blue-600 hover:bg-blue-700 transition px-6 py-2 rounded-xl font-medium shadow-lg hover:scale-105"
        >
          Upload & Analyze
        </button>
      )}
    </div>
  );
}

export default UploadBox;
