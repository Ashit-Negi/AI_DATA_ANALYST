import React, { useEffect, useState } from "react";

function SuggestionChips({ onClick, data }) {
  const [suggestions, setSuggestions] = useState([]);

 useEffect(() => {
  if (!data || data.length === 0) return;

  const columns = Object.keys(data[0]);

  const numericCol = columns.find((col) =>
    data.some((row) => !isNaN(Number(row[col])))
  );

  const categoryCol = columns.find(
    (col) => typeof data[0][col] === "string"
  );

  const dynamicSuggestions = [];

  if (categoryCol && numericCol) {
    dynamicSuggestions.push(`Top 5 ${categoryCol} by ${numericCol}`);
    dynamicSuggestions.push(`Lowest ${numericCol} ${categoryCol}`);
    dynamicSuggestions.push(`Show ${numericCol} distribution by ${categoryCol}`);
    dynamicSuggestions.push(`Average ${numericCol} per ${categoryCol}`);
  }

  if (numericCol) {
    dynamicSuggestions.push(`Total ${numericCol}`);
  }

  setSuggestions(dynamicSuggestions);
}, [data]);

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((item, index) => (
        <button
          key={index}
          onClick={() => onClick(item)}
          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-full transition"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export default SuggestionChips;
