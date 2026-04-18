const axios = require("axios");

let lastResult = null;
let lastQuery = null;

// SAFE NUMBER
function getNumber(val) {
  if (val === null || val === undefined) return NaN;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
  return isNaN(num) ? NaN : num;
}

// FIND BEST MATCH
function findBestMatch(target, columns) {
  if (!target) return null;

  target = target.toLowerCase();

  return columns.find(
    (col) =>
      col.toLowerCase() === target ||
      col.toLowerCase().includes(target) ||
      target.includes(col.toLowerCase())
  );
}

// INSIGHTS
function generateInsights(raw) {
  if (!raw.length) return "No insights available";

  const top = raw[0];
  const total = raw.reduce((sum, r) => sum + r[1], 0);

  return `Top is ${top[0]} with ${top[1]}. Total is ${total}.`;
}

// AI FUNCTION
async function askAI(question, columns) {
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `
You are a data analyst AI.

Available columns:
${columns.join(", ")}

Return STRICT JSON:
{
  "invalid": false,
  "operation": "group_by | max | min | trend",
  "groupBy": "column name",
  "metric": "column name",
  "limit": 5
}
Only JSON. No explanation.
`,
          },
          {
            role: "user",
            content: question,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    let text = res.data.choices[0].message.content;
    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text);
  } catch (err) {
    console.error("AI Error:", err.message);
    return { invalid: true };
  }
}

// MAIN CONTROLLER
exports.handleQuery = async (req, res) => {
  const { question, data } = req.body;

  if (!data || data.length === 0) {
    return res.json({ answer: "No data", raw: [] });
  }

  const columns = Object.keys(data[0]);

  const numericColumns = columns.filter((col) =>
    data.some((row) => !isNaN(getNumber(row[col])))
  );

  const categoricalColumns = columns.filter(
    (col) => !numericColumns.includes(col)
  );

  const aiResult = await askAI(question, columns);

  // 🔥 RULE FIXES
  const q = question.toLowerCase();

  const matchTop = q.match(/top\s*(\d+)/);
  if (matchTop) {
    aiResult.operation = "group_by";
    aiResult.limit = parseInt(matchTop[1]);
  }

  if (q.includes("total") || q.includes("sum")) {
    aiResult.operation = "sum";
  }

  if (q.includes("lowest") || q.includes("minimum")) {
    aiResult.operation = "min";
  }

  if ((q.includes("highest") || q.includes("top")) && !matchTop) {
    aiResult.operation = "max";
  }

  if (aiResult.invalid) {
    return res.json({
      answer: "⚠️ Please ask something related to your dataset",
      raw: [],
      chartType: "bar",
    });
  }

  let operation = aiResult.operation || "group_by";

  let groupKey =
    findBestMatch(aiResult.groupBy, columns) ||
    categoricalColumns.find((col) =>
      q.includes(col.toLowerCase())
    ) ||
    categoricalColumns[0];

  let metricKey =
    findBestMatch(aiResult.metric, columns) ||
    numericColumns.find((col) =>
      q.includes(col.toLowerCase())
    ) ||
    numericColumns[0];

  if (!groupKey || !metricKey) {
    return res.json({
      answer: "Couldn't understand dataset",
      raw: [],
      chartType: "bar",
    });
  }

  // 🔥 SUM
  if (operation === "sum") {
    let total = 0;

    data.forEach((row) => {
      const value = getNumber(row[metricKey]);
      if (!isNaN(value)) total += value;
    });

    return res.json({
      answer: `Total ${metricKey} is ${total}`,
      raw: [["Total", total]],
      chartType: "bar",
      summary: [{ category: "Total", value: total }],
    });
  }

  // AGGREGATION
  let result = {};

  data.forEach((row) => {
    const key = row[groupKey];
    const value = getNumber(row[metricKey]);

    if (!key || isNaN(value)) return;

    result[key] = (result[key] || 0) + value;
  });

  let sorted = Object.entries(result);

  if (!sorted.length) {
    return res.json({
      answer: "No usable data found",
      raw: [],
      chartType: "bar",
    });
  }

  let raw = [];
  let answer = "";
  let chartType = "bar";

  if (operation === "trend") {
    chartType = "line";
    raw = sorted;
    answer = generateInsights(raw);
  } else if (operation === "max") {
    sorted.sort((a, b) => b[1] - a[1]);
    raw = [sorted[0]];
    answer = `Highest is ${sorted[0][0]} with ${sorted[0][1]}`;
  } else if (operation === "min") {
    sorted.sort((a, b) => a[1] - b[1]);
    raw = [sorted[0]];
    answer = `Lowest is ${sorted[0][0]} with ${sorted[0][1]}`;
  } else {
    sorted.sort((a, b) => b[1] - a[1]);
    raw = sorted.slice(0, aiResult.limit || 5);
    answer = `Top ${raw.length} ${groupKey} by ${metricKey}`;
  }

  const formattedData = raw.map((item) => ({
    category: item[0],
    value: item[1],
  }));

  res.json({
    answer,
    raw,
    chartType,
    summary: formattedData,
  });
};