const axios = require("axios");

let lastResult = null;
let lastQuery = null;

// 🔥 SAFE NUMBER
function getNumber(val) {
  if (val === null || val === undefined) return NaN;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
  return isNaN(num) ? NaN : num;
}

// 🔥 FIND BEST MATCH
function findBestMatch(target, columns) {
  if (!target) return null;

  target = target.toLowerCase();

  return columns.find(
    (col) =>
      col.toLowerCase() === target ||
      col.toLowerCase().includes(target) ||
      target.includes(col.toLowerCase()),
  );
}

// 🔥 INSIGHTS
function generateInsights(raw) {
  if (!raw.length) return "No insights available";

  const top = raw[0];
  const total = raw.reduce((sum, r) => sum + r[1], 0);

  return `Top is ${top[0]} with ${top[1]}. Total is ${total}.`;
}

// 🔥 AI FUNCTION
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

Step 1: Check if the user query is related to data analysis.

If NOT related:
Return:
{ "invalid": true }

If YES:
Return STRICT JSON:
{
  "invalid": false,
  "operation": "group_by | max | min | trend",
  "groupBy": "column name",
  "metric": "column name",
  "limit": 5
}

Rules:
- Only JSON
- No explanation
- Use ONLY given columns
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
      },
    );

    let text = res.data.choices[0].message.content;

    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text);
  } catch (err) {
    console.error("AI Error:", err.message);
    return { invalid: true };
  }
}

// 🔥 MAIN CONTROLLER
exports.handleQuery = async (req, res) => {
  const { question, data } = req.body;

  if (!data || data.length === 0) {
    return res.json({ answer: "No data", raw: [] });
  }

  const columns = Object.keys(data[0]);

  // 🔥 TYPE DETECTION
  const numericColumns = columns.filter((col) =>
    data.some((row) => !isNaN(getNumber(row[col]))),
  );

  const categoricalColumns = columns.filter(
    (col) => !numericColumns.includes(col),
  );

  // 🔥 AI CALL
  const aiResult = await askAI(question, columns);

  console.log("AI:", aiResult);

  // 🔥 INVALID QUERY CHECK
  if (aiResult.invalid) {
    return res.json({
      answer: "⚠️ Please ask something related to your dataset",
      raw: [],
      chartType: "bar",
    });
  }

  let operation = aiResult.operation || "group_by";
  let groupKey = findBestMatch(aiResult.groupBy, columns);
  let metricKey = findBestMatch(aiResult.metric, columns);

  // 🔥 FALLBACK
  if (!groupKey) groupKey = categoricalColumns[0];
  if (!metricKey) metricKey = numericColumns[0];

  if (!groupKey || !metricKey) {
    return res.json({
      answer: "Couldn't understand dataset",
      raw: [],
      chartType: "bar",
    });
  }

  // 🔥 AGGREGATION
  let result = {};

  data.forEach((row) => {
    const key = row[groupKey];
    const value = getNumber(row[metricKey]);

    if (!key || isNaN(value)) return;

    result[key] = (result[key] || 0) + value;
  });

  let sorted = Object.entries(result);

  // 🔥 CRITICAL SAFETY FIX
  if (!sorted || sorted.length === 0) {
    return res.json({
      answer: "No usable numeric data found in dataset",
      raw: [],
      chartType: "bar",
    });
  }

  let raw = [];
  let answer = "";
  let chartType = "bar";

  // 🔥 TREND
  if (operation === "trend") {
    chartType = "line";

    if (!sorted.length) {
      return res.json({
        answer: "No trend data available",
        raw: [],
        chartType,
      });
    }

    raw = sorted;
    answer = generateInsights(raw);
  }

  // 🔥 MAX
  else if (operation === "max") {
    sorted.sort((a, b) => b[1] - a[1]);

    if (!sorted[0]) {
      return res.json({
        answer: "No valid data for analysis",
        raw: [],
        chartType,
      });
    }

    raw = [sorted[0]];
    answer = `Highest is ${sorted[0][0]} with ${sorted[0][1]}`;
  }

  // 🔥 MIN
  else if (operation === "min") {
    sorted.sort((a, b) => a[1] - b[1]);

    if (!sorted[0]) {
      return res.json({
        answer: "No valid data for analysis",
        raw: [],
        chartType,
      });
    }

    raw = [sorted[0]];
    answer = `Lowest is ${sorted[0][0]} with ${sorted[0][1]}`;
  }

  // 🔥 GROUP BY
  else {
    sorted.sort((a, b) => b[1] - a[1]);

    raw = sorted.slice(0, aiResult.limit || 5);

    if (!raw.length) {
      return res.json({
        answer: "No meaningful data found",
        raw: [],
        chartType,
      });
    }

    answer = generateInsights(raw);
  }

  res.json({ answer, raw, chartType });
};
