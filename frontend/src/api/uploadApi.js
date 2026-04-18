import axios from "axios";
import BASE_URL from "../config";

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${BASE_URL}/api/upload`, formData);
  return res.data;
};
