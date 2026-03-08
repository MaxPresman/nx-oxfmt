import { ExecutorContext, logger } from "@nx/devkit";
import { join } from "path";
import { CheckExecutorSchema } from "./schema";
import { runOxfmt } from "../../utils/run-oxfmt";

export async function checkExecutor(
  options: CheckExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const projectName = context.projectName;
  if (!projectName) {
    throw new Error("No project name provided");
  }

  const projectConfig = context.projectsConfigurations?.projects[projectName];
  if (!projectConfig) {
    throw new Error(`Could not find project configuration for ${projectName}`);
  }

  const workspaceRoot = context.root;
  const projectRoot = join(workspaceRoot, projectConfig.root);

  const result = runOxfmt({
    options: { ...options, check: true },
    projectRoot,
    workspaceRoot,
  });

  if (result.success) {
    logger.info("oxfmt check passed — all files are formatted");
  } else {
    logger.error("oxfmt check failed — some files are not formatted");
  }

  return result;
}

export default checkExecutor;
