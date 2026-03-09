import { execFileSync } from "child_process";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Resolves the oxfmt binary path. Checks the local node_modules first,
 * then falls back to a globally installed binary.
 */
export function resolveOxfmtBinary(workspaceRoot: string): string {
  const localBin = join(workspaceRoot, "node_modules", ".bin", "oxfmt");
  if (existsSync(localBin)) {
    return localBin;
  }

  try {
    const command = process.platform === "win32" ? "where" : "which";
    const globalPath = execFileSync(command, ["oxfmt"], { encoding: "utf-8" }).trim();
    if (globalPath) {
      return globalPath;
    }
  } catch {
    // not found globally
  }

  throw new Error("Could not find oxfmt binary. Install it with: npm install oxfmt --save-dev");
}
