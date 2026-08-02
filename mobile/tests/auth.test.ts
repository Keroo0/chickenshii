import assert from "node:assert/strict";
import test from "node:test";

import {
  getRoleFromUser,
  getRoleHomeRoute,
} from "../utils/auth.ts";

test("maps every supported role to its protected home", () => {
  assert.equal(getRoleHomeRoute("admin"), "/admin");
  assert.equal(getRoleHomeRoute("veterinarian"), "/doctor");
  assert.equal(getRoleHomeRoute("head_worker"), "/head-worker");
});

test("does not map an unknown or missing role", () => {
  assert.equal(getRoleHomeRoute("worker"), null);
  assert.equal(getRoleHomeRoute(undefined), null);
  assert.equal(getRoleHomeRoute(null), null);
});

test("extracts a supported role only from app_metadata", () => {
  assert.equal(
    getRoleFromUser({
      app_metadata: { role: "veterinarian" },
      user_metadata: { role: "admin" },
    }),
    "veterinarian",
  );
});

test("ignores unsafe metadata shapes and user_metadata roles", () => {
  assert.equal(getRoleFromUser({ user_metadata: { role: "admin" } }), null);
  assert.equal(getRoleFromUser({ app_metadata: { role: "owner" } }), null);
  assert.equal(getRoleFromUser({ app_metadata: null }), null);
  assert.equal(getRoleFromUser(null), null);
});
