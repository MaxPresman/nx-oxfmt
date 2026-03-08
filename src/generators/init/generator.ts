import {
  Tree,
  addDependenciesToPackageJson,
  logger,
  formatFiles,
  readJson,
  writeJson,
} from "@nx/devkit";
import { execSync } from "child_process";
import { InitGeneratorSchema } from "./schema";

const DEFAULT_OXFMTRC =
  JSON.stringify(
    { printWidth: 100, singleQuote: true, trailingComma: "all", endOfLine: "lf" },
    null,
    2,
  ) + "\n";

function addPluginToNxJson(tree: Tree, formatTargetName: string, checkTargetName: string) {
  if (!tree.exists("nx.json")) return;

  const nxJson = readJson(tree, "nx.json");
  nxJson.plugins = nxJson.plugins ?? [];

  const alreadyRegistered = nxJson.plugins.some(
    (p: string | { plugin: string }) =>
      (typeof p === "string" && p === "nx-oxfmt/plugin") ||
      (typeof p === "object" && p.plugin === "nx-oxfmt/plugin"),
  );

  if (alreadyRegistered) {
    logger.info("nx-oxfmt plugin already registered in nx.json");
    return;
  }

  const useDefaults = formatTargetName === "format" && checkTargetName === "format-check";

  if (useDefaults) {
    nxJson.plugins.push("nx-oxfmt/plugin");
  } else {
    nxJson.plugins.push({
      plugin: "nx-oxfmt/plugin",
      options: { formatTargetName, checkTargetName },
    });
  }

  writeJson(tree, "nx.json", nxJson);
  logger.info("Registered nx-oxfmt plugin in nx.json");
}

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  const oxfmtVersion = options.oxfmtVersion ?? "latest";

  // Add oxfmt as a dev dependency
  if (!options.skipInstall) {
    addDependenciesToPackageJson(tree, {}, { oxfmt: oxfmtVersion });
  }

  // Scaffold .oxfmtrc.json if it doesn't already exist
  if (!tree.exists(".oxfmtrc.json")) {
    tree.write(".oxfmtrc.json", DEFAULT_OXFMTRC);
    logger.info("Created .oxfmtrc.json");
  } else {
    logger.info(".oxfmtrc.json already exists, skipping");
  }

  // Register plugin in nx.json
  const formatTargetName = options.formatTargetName ?? "format";
  const checkTargetName = options.checkTargetName ?? "format-check";
  addPluginToNxJson(tree, formatTargetName, checkTargetName);

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
