import { execFileSync } from "child_process";
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

  logger.info(`Running: ${oxfmtBin} ${args.join(" ")}`);

  try {
    execFileSync(oxfmtBin, args, {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
    return { success: true };
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e.message);
    }
    return { success: false };
  }
}
