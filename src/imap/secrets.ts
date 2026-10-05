import { readFileSync } from "node:fs";

type Env = Record<string, string | undefined>;

/**
 * Resolve a secret from `<NAME>_FILE` or `<NAME>`. The file wins: a mounted
 * file is not exposed by /proc, a crash dump or an inherited environment the
 * way a variable is.
 */
export function resolveSecret(env: Env, name: string): string {
  const fileVar = `${name}_FILE`;
  const path = env[fileVar];

  if (path) {
    let raw: string;
    try {
      raw = readFileSync(path, "utf8");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      // No falling back to the variable: that would start the server with a
      // different credential than the operator asked for.
      throw new Error(`${fileVar} points at ${path}, which cannot be read: ${reason}`);
    }

    const value = raw.replace(/\r?\n$/, "");
    if (value.length === 0) {
      throw new Error(`${fileVar} points at ${path}, which is empty`);
    }
    return value;
  }

  const direct = env[name];
  if (direct) return direct;

  throw new Error(`${name} or ${fileVar} environment variable is required`);
}
