import { ExecutorContext, logger } from "@nx/devkit";
import { join } from "path";
import { FormatExecutorSchema } from "./schema";
import { runOxfmt } from "../../utils/run-oxfmt";

export async function formatExecutor(
  options: FormatExecutorSchema,
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

  const result = runOxfmt({ options, projectRoot, workspaceRoot });

  if (result.success) {
    logger.info("oxfmt format completed successfully");
  } else {
    logger.error("oxfmt format failed");
  }

  return result;
}

export default formatExecutor;
