import axios from "axios";

import { API_URL } from "../constants/env";
import { isTrustedApiRequestDestination } from "../utils/apiSecurity";
import { supabase } from "./supabase";

const staffApi = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

staffApi.interceptors.request.use(async (config) => {
  const isTrustedDestination = isTrustedApiRequestDestination(
    config.url,
    config.baseURL ?? staffApi.defaults.baseURL,
    API_URL,
  );

  if (!isTrustedDestination) {
    config.headers.delete("Authorization");
    return config;
  }

  const { data } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };
  const accessToken = data.session?.access_token;
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export default staffApi;
