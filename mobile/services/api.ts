import axios from "axios";
import { API_URL } from "../constants/env";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

export default api;
