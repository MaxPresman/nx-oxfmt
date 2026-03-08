import { execSync } from "child_process";
import { logger } from "@nx/devkit";
import { resolveOxfmtBinary } from "./resolve-oxfmt";
import { buildOxfmtArgs, BaseOxfmtOptions } from "./normalize-options";

export interface RunOxfmtParams {
  options: BaseOxfmtOptions & { check?: boolean };
  projectRoot: string;
  workspaceRoot: string;
}

export function runOxfmt(params: RunOxfmtParams): { success: boolean } {
  const { options, projectRoot, workspaceRoot } = params;
  const oxfmtBin = resolveOxfmtBinary(workspaceRoot);
  const args = buildOxfmtArgs(options, projectRoot, workspaceRoot);
  const command = `${oxfmtBin} ${args.join(" ")}`;

  logger.info(`Running: ${command}`);

  try {
    execSync(command, {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
