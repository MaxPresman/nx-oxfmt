import { Tree, addDependenciesToPackageJson, generateFiles, logger, formatFiles } from "@nx/devkit";
import { execSync } from "child_process";
import { join } from "path";
import { InitGeneratorSchema } from "./schema";

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  const oxfmtVersion = options.oxfmtVersion ?? "latest";

  // Add oxfmt as a dev dependency
  if (!options.skipInstall) {
    addDependenciesToPackageJson(tree, {}, { oxfmt: oxfmtVersion });
  }

  // Scaffold .oxfmtrc.json if it doesn't already exist
  if (!tree.exists(".oxfmtrc.json")) {
    generateFiles(tree, join(__dirname, "files"), ".", {});
    logger.info("Created .oxfmtrc.json");
  } else {
    logger.info(".oxfmtrc.json already exists, skipping");
  }

  // Migrate from Prettier if requested
  if (options.migratePrettier) {
    logger.info("Migrating Prettier configuration to oxfmt...");
    try {
      execSync("npx oxfmt --migrate prettier", {
        stdio: "inherit",
      });
      logger.info("Prettier migration completed");
    } catch {
      logger.warn("Prettier migration failed. You may need to migrate manually.");
    }
  }

  await formatFiles(tree);
}

export default initGenerator;
