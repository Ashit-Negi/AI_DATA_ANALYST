const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://ai-data-analyst-5v0c.onrender.com";

export default BASE_URL;
