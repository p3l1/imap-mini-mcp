import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveSecret } from "./secrets.js";

function fileWith(contents: string): string {
  const path = join(mkdtempSync(join(tmpdir(), "imap-secret-")), "secret");
  writeFileSync(path, contents, { mode: 0o600 });
  return path;
}

describe("resolveSecret", () => {
  it("reads the value from the file named by the _FILE variable", () => {
    const env = { IMAP_PASS_FILE: fileWith("from-file") };

    expect(resolveSecret(env, "IMAP_PASS")).toBe("from-file");
  });

  // A file written by `echo` or mounted from a secret store usually ends in a
  // newline, which would travel into the IMAP login as part of the password.
  it("strips the trailing newline a file usually carries", () => {
    const env = { IMAP_PASS_FILE: fileWith("from-file\n") };

    expect(resolveSecret(env, "IMAP_PASS")).toBe("from-file");
  });

  it("prefers the file over the plain variable", () => {
    const env = { IMAP_PASS: "from-env", IMAP_PASS_FILE: fileWith("from-file") };

    expect(resolveSecret(env, "IMAP_PASS")).toBe("from-file");
  });

  it("falls back to the plain variable", () => {
    expect(resolveSecret({ IMAP_PASS: "from-env" }, "IMAP_PASS")).toBe("from-env");
  });

  it("names both variables when neither is set", () => {
    expect(() => resolveSecret({}, "IMAP_PASS")).toThrow(/IMAP_PASS_FILE/);
    expect(() => resolveSecret({}, "IMAP_PASS")).toThrow(/IMAP_PASS/);
  });

  // Silently falling back would start the server with the wrong credential and
  // fail later at the IMAP login, where the cause is no longer visible.
  it("names the path when the file cannot be read", () => {
    const env = { IMAP_PASS_FILE: "/nope/missing", IMAP_PASS: "from-env" };

    expect(() => resolveSecret(env, "IMAP_PASS")).toThrow(/\/nope\/missing/);
  });

  it("rejects an empty file", () => {
    const env = { IMAP_PASS_FILE: fileWith("\n") };

    expect(() => resolveSecret(env, "IMAP_PASS")).toThrow(/empty/i);
  });
});
