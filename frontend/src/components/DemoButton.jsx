import React from "react";

function DemoButton() {
  return (
    <a
      href="/demo.csv"
      download="demo.csv"
      className="mt-4 inline-block px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-sm"
    >
      ⬇️ Download Demo Dataset
    </a>
  );
}

export default DemoButton;
