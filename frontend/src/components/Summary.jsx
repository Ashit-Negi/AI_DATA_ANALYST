import React from "react";

function Summary({ data }) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  // detect numeric column
  const numericCol = columns.find((col) =>
    data.some((row) => !isNaN(Number(row[col])))
  );

  // detect categorical column
  const categoryCol = columns.find((col) => typeof data[0][col] === "string");

  if (!numericCol || !categoryCol) return null;

  let total = 0;
  let groupMap = {};

  data.forEach((row) => {
    const value = Number(row[numericCol]) || 0;
    const key = row[categoryCol];

    total += value;

    if (!groupMap[key]) groupMap[key] = 0;
    groupMap[key] += value;
  });

  const sorted = Object.entries(groupMap).sort((a, b) => b[1] - a[1]);

  const topItem = sorted[0];
  const totalGroups = sorted.length;

  const average = totalGroups > 0 ? total / totalGroups : 0;

  return (
    <div className="mt-4 bg-white/5 p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">📊 Dataset Summary</h2>

      <div className="space-y-2 text-slate-300">
        <p>
          • Total {numericCol}: <b>{total}</b>
        </p>

        <p>
          • Total {categoryCol}s: <b>{totalGroups}</b>
        </p>

        <p>
          • Average {numericCol}: <b>{average.toFixed(1)}</b>
        </p>

        {topItem && (
          <p>
            • Top {categoryCol}: <b>{topItem[0]}</b> ({topItem[1]})
          </p>
        )}
      </div>

      {/* 🔥 IMPROVED INSIGHTS */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">💡 Insights</h3>

        <ul className="list-disc ml-5 text-slate-300 space-y-1">
          {topItem && (
            <li>
              {topItem[0]} contributes{" "}
              {((topItem[1] / total) * 100).toFixed(1)}% of total {numericCol}
            </li>
          )}

          <li>
            Average {numericCol} per {categoryCol} is{" "}
            {average.toFixed(1)}
          </li>

          <li>
            Data is distributed across {totalGroups} different {categoryCol}s
          </li>

          {totalGroups > 3 && (
            <li>
              Top 3 {categoryCol}s contribute a major portion of total{" "}
              {numericCol}
            </li>
          )}

          {topItem && topItem[1] > average * 2 && (
            <li>
              {topItem[0]} is significantly higher than average, indicating
              strong dominance
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Summary;