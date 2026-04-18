import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import MessageBubble from "../components/MessageBubble";
import ChartBox from "../components/ChartBox";
import Summary from "../components/Summary";
import SuggestionChips from "../components/SuggestionChips";
import DownloadReport from "../components/DownloadReport";

function Dashboard() {
  const [chartType, setChartType] = useState("bar");
  const [summaryData, setSummaryData] = useState(null);
  const [xLabel, setXLabel] = useState("");
  const [yLabel, setYLabel] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const chartRef = useRef();

  const location = useLocation();
  const fileName = location.state?.fileName;
  const data = location.state?.data;

  const [messages, setMessages] = useState([
    { text: "Your dataset is ready! Ask something 📊", sender: "ai" },
  ]);

  const [chartData, setChartData] = useState([]);
  const [input, setInput] = useState("");

  //  DEFAULT CHART
  useEffect(() => {
    if (!data?.data || data.data.length === 0) {
      setMessages([
        {
          text: "⚠️ PDF not supported. Please upload CSV or Excel.",
          sender: "ai",
        },
      ]);
      return;
    }

    const rows = data.data;
    const columns = Object.keys(rows[0]);

    const numericCol = columns.find((col) =>
      rows.some((r) => !isNaN(Number(r[col]))),
    );

    const categoryCol = columns.find((col) => typeof rows[0][col] === "string");

    if (!numericCol || !categoryCol) {
      setMessages([
        {
          text: fileName?.endsWith(".pdf")
            ? " PDF data is not structured. Use CSV/Excel."
            : "Couldn't generate chart from dataset.",
          sender: "ai",
        },
      ]);
      return;
    }

    const result = {};

    rows.forEach((row) => {
      const key = row[categoryCol];
      const value = Number(row[numericCol]);

      if (!key || isNaN(value)) return;

      result[key] = (result[key] || 0) + value;
    });

    setChartData(Object.entries(result));
    setXLabel(categoryCol);
    setYLabel(numericCol);

    setMessages([
      {
        text: `Showing ${numericCol} grouped by ${categoryCol}`,
        sender: "ai",
      },
    ]);
  }, [data, fileName]);

  //  SEND QUERY (FIXED)
  const handleSend = async () => {
    if (!input.trim()) return;

    setLastQuestion(input);

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    setInput("");

    setMessages((prev) => [...prev, { text: "Thinking...", sender: "ai" }]);

    try {
      const res = await fetch("http://localhost:5000/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input,
          data: data?.data || [],
        }),
      });

      const result = await res.json();

      //  MAIN FIX (IMPORTANT)
      if (!result.raw || result.raw.length === 0) {
        setMessages((prev) => {
          const updated = [...prev];
          updated.pop();

          return [
            ...updated,
            {
              text:
                result.answer ||
                " Cannot analyze this data. Try CSV or Excel.",
              sender: "ai",
            },
          ];
        });

        setChartData([]);
        return;
      }

      setChartData(result.raw);
      setChartType(result.chartType || "bar");

      setXLabel("Category");
      setYLabel("Value");

      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        return [...updated, { text: result.answer, sender: "ai" }];
      });
    } catch (err) {
      console.error(err);

      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        return [...updated, { text: "Error occurred", sender: "ai" }];
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-semibold">AI Data Dashboard</h1>
          <p className="text-xs text-slate-400">
            📄 {fileName || "No file uploaded"}
          </p>
        </div>

        {chartData.length > 0 && (
          <DownloadReport
            chartData={chartData}
            question={lastQuestion}
            answer={messages[messages.length - 1]?.text}
            chartRef={chartRef}
          />
        )}
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-1/5 border-r border-white/10 p-4">
          <h2 className="text-lg font-semibold">Dataset Info</h2>

          <div className="mt-4 bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-slate-400">File</p>
            <p className="text-sm text-blue-400 break-words">{fileName}</p>
          </div>

          <div className="mt-3 bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-slate-400">Rows</p>
            <p className="text-sm">{data?.rows}</p>
          </div>

          <div className="mt-3 bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-slate-400">Columns</p>
            <p className="text-sm">
              {Object.keys(data?.data?.[0] || {}).length}
            </p>
          </div>
        </div>

        {/* CHAT */}
        <div className="w-2/5 flex flex-col border-r border-white/10">
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {messages.map((msg, index) => (
              <MessageBubble key={index} text={msg.text} sender={msg.sender} />
            ))}
          </div>

          <div className="px-4 pb-2">
            <SuggestionChips
              onClick={(text) => setInput(text)}
              data={data?.data}
            />
          </div>

          <div className="p-4 border-t border-white/10 flex gap-2 bg-slate-900">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your data..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none"
            />

            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl"
            >
              Send
            </button>
          </div>
        </div>

        {/* OUTPUT */}
        <div className="w-2/5 p-4 flex flex-col overflow-y-auto">
          <div className="bg-white/5 p-4 rounded-xl shadow-lg flex flex-col min-h-[400px]">
            <h2 className="text-lg font-semibold mb-2">Analysis</h2>

            <p className="text-xs text-slate-400 mb-2">
              X: {xLabel} | Y: {yLabel}
            </p>

            <div className="flex-1">
              {chartData.length > 0 ? (
                <div ref={chartRef} className="h-full">
                  <ChartBox
                    data={chartData}
                    type={chartType}
                    xLabel={xLabel}
                    yLabel={yLabel}
                  />
                </div>
              ) : (
                <div className="text-slate-400 text-center mt-20">
                   No chart data available
                </div>
              )}
            </div>
          </div>

          {summaryData && <Summary data={summaryData} />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
