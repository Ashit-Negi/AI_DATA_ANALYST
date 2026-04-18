import React, { useState } from "react";
import UploadBox from "../components/UploadBox";
import DemoButton from "../components/DemoButton";
import Loader from "../components/Loader";
import { uploadFile } from "../api/uploadApi";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpload = async (file) => {
    if (!file) return;

    try {
      setLoading(true);

      const data = await uploadFile(file);

      setLoading(false);

      navigate("/dashboard", {
        state: {
          data,
          fileName: file.name,
        },
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4">
      {/*  HEADER */}
      <div className="text-center max-w-3xl mb-10">
        <h1 className="text-5xl font-bold tracking-tight">AI Data Analyst</h1>

        <p className="text-slate-400 mt-4 text-lg">
          Upload your dataset and get instant insights, charts, and summaries —
          no manual analysis needed.
        </p>
      </div>

      {/*  MAIN CARD */}
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl">
        {/* Upload */}
        <UploadBox onUpload={handleUpload} />

        {/* Demo Button */}
        <div className="mt-6">
          <p className="text-xs text-slate-500 mt-2">
            Download a sample dataset and try it yourself
          </p>
          <DemoButton />
        </div>
      </div>

      {/*  FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl text-center">
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
          <p className="text-sm text-slate-300 font-medium">
            📊 Smart Visualizations
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Auto-generated charts from your data
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
          <p className="text-sm text-slate-300 font-medium">🤖 AI Insights</p>
          <p className="text-xs text-slate-500 mt-1">
            Get summaries and key takeaways instantly
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
          <p className="text-sm text-slate-300 font-medium">
            📁 Multi-format Upload
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports CSV, Excel, and PDF files
          </p>
        </div>
      </div>

      {/*  LOADER */}
      {loading && <Loader />}
    </div>
  );
}

export default LandingPage;
