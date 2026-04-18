import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from "chart.js";

import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

function ChartBox({ data, type, xLabel = "", yLabel = "" }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No chart data available
      </div>
    );
  }

  //  clean data
  const safeData = data.filter(
    (item) => item && item.length === 2 && !isNaN(item[1]),
  );

  const labels = safeData.map((item) => item[0]);
  const values = safeData.map((item) => item[1]);

  //  dynamic colors
  const colors = labels.map((_, i) => `hsl(${(i * 60) % 360}, 70%, 55%)`);

  const chartData = {
    labels,
    datasets: [
      {
        label: yLabel || "Value",
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "white",
        },
      },
    },
    scales:
      type !== "pie"
        ? {
            x: {
              title: {
                display: true,
                text: xLabel || "Category",
                color: "white",
              },
              ticks: { color: "white" },
              grid: { color: "rgba(255,255,255,0.1)" },
            },
            y: {
              title: {
                display: true,
                text: yLabel || "Value",
                color: "white",
              },
              ticks: { color: "white" },
              grid: { color: "rgba(255,255,255,0.1)" },
            },
          }
        : {},
  };

  return (
    <div className="w-full h-full">
      {type === "line" && <Line data={chartData} options={options} />}
      {type === "pie" && <Pie data={chartData} options={options} />}
      {type === "bar" && <Bar data={chartData} options={options} />}
    </div>
  );
}

export default ChartBox;
