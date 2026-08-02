import assert from "node:assert/strict";
import test from "node:test";

import { isTrustedApiRequestDestination } from "../utils/apiSecurity.ts";

const TRUSTED_API_URL = "https://api.chikenshii.example/v1";

test("allows a relative request resolved against the trusted API origin", () => {
  assert.equal(
    isTrustedApiRequestDestination(
      "/api/v1/doctor/validations/pending",
      TRUSTED_API_URL,
      TRUSTED_API_URL,
    ),
    true,
  );
});

test("allows an explicit absolute request on the trusted API origin", () => {
  assert.equal(
    isTrustedApiRequestDestination(
      "https://api.chikenshii.example/api/v1/stats",
      "https://custom-worker.example",
      TRUSTED_API_URL,
    ),
    true,
  );
});

test("rejects a relative request resolved against a custom foreign base URL", () => {
  assert.equal(
    isTrustedApiRequestDestination(
      "/api/v1/doctor/validations/pending",
      "https://custom-worker.example",
      TRUSTED_API_URL,
    ),
    false,
  );
});

test("rejects an absolute foreign request overriding a trusted base URL", () => {
  assert.equal(
    isTrustedApiRequestDestination(
      "https://attacker.example/collect",
      TRUSTED_API_URL,
      TRUSTED_API_URL,
    ),
    false,
  );
});

test("rejects a request when its destination cannot be parsed", () => {
  assert.equal(
    isTrustedApiRequestDestination(
      "http://[invalid-host",
      TRUSTED_API_URL,
      TRUSTED_API_URL,
    ),
    false,
  );
});
