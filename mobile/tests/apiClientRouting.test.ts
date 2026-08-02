import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const MOBILE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath: string): string {
  return readFileSync(resolve(MOBILE_ROOT, relativePath), "utf8");
}

test("anonymous API client is configurable and contains no staff authentication", () => {
  const anonymousApi = source("services/api.ts");

  assert.match(anonymousApi, /baseURL:\s*API_URL/);
  assert.match(anonymousApi, /api\.defaults\.baseURL\s*=/);
  assert.doesNotMatch(anonymousApi, /services\/supabase|\.\/supabase/);
  assert.doesNotMatch(anonymousApi, /getSession|Authorization|interceptors\.request/);
});

test("staff API client is fixed to API_URL and owns the auth interceptor", () => {
  const staffApiPath = resolve(MOBILE_ROOT, "services/staffApi.ts");
  assert.equal(existsSync(staffApiPath), true, "services/staffApi.ts must exist");

  const staffApi = readFileSync(staffApiPath, "utf8");
  assert.match(staffApi, /baseURL:\s*API_URL/);
  assert.match(staffApi, /\.\/supabase/);
  assert.match(staffApi, /getSession/);
  assert.match(staffApi, /Authorization/);
  assert.match(staffApi, /isTrustedApiRequestDestination/);
  assert.doesNotMatch(staffApi, /custom_api_url|saveApiUrl|loadSavedApiUrl/);
});

test("workflow and staff provisioning use staffApi", () => {
  const workflow = source("services/workflow.ts");
  const usersScreen = source("app/admin/(tabs)/workers.tsx");

  assert.match(workflow, /import staffApi from "\.\/staffApi"/);
  assert.doesNotMatch(workflow, /import api from "\.\/api"/);
  assert.match(usersScreen, /import staffApi from "\.\.\/\.\.\/\.\.\/services\/staffApi"/);
  assert.match(usersScreen, /staffApi\.post\("\/api\/v1\/staff-accounts"/);
});

test("anonymous prediction screens continue using the configurable API client", () => {
  for (const path of ["app/index.tsx", "app/result.tsx"]) {
    const screen = source(path);
    assert.match(screen, /import api from "\.\.\/services\/api"/);
    assert.doesNotMatch(screen, /staffApi/);
    assert.match(screen, /api\.defaults\.baseURL/);
  }

  const rootLayout = source("app/_layout.tsx");
  const settings = source("app/settings.tsx");
  assert.match(rootLayout, /loadSavedApiUrl.*from "\.\.\/services\/api"/);
  assert.doesNotMatch(rootLayout, /staffApi/);
  assert.match(settings, /from "\.\.\/services\/api"/);
  assert.doesNotMatch(settings, /staffApi/);
});
