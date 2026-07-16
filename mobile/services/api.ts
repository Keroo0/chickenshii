import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/env";

const API_URL_KEY = "custom_api_url";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

/** Load saved URL from SecureStore and apply to axios. Call once on app startup. */
export async function loadSavedApiUrl(): Promise<string> {
  const saved = await SecureStore.getItemAsync(API_URL_KEY);
  if (saved) api.defaults.baseURL = saved;
  return api.defaults.baseURL as string;
}

/** Save a new URL and apply immediately. Pass empty string to reset to default. */
export async function saveApiUrl(url: string): Promise<void> {
  if (url) {
    // ponytail: strip trailing slash to avoid double-slash in paths
    const clean = url.replace(/\/+$/, "");
    await SecureStore.setItemAsync(API_URL_KEY, clean);
    api.defaults.baseURL = clean;
  } else {
    await SecureStore.deleteItemAsync(API_URL_KEY);
    api.defaults.baseURL = API_URL;
  }
}

export default api;
