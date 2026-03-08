import {
  CreateNodesV2,
  CreateNodesContextV2,
  createNodesFromFiles,
  joinPathFragments,
  TargetConfiguration,
} from "@nx/devkit";
import { existsSync, readdirSync } from "fs";
import { join, dirname } from "path";

export interface OxfmtPluginOptions {
  formatTargetName?: string;
  checkTargetName?: string;
}

const JS_TS_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
  ".css",
  ".scss",
  ".less",
  ".html",
  ".vue",
  ".md",
  ".mdx",
  ".yaml",
  ".yml",
  ".toml",
  ".graphql",
]);

function hasFormattableFiles(dir: string): boolean {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules") continue;
      if (entry.isDirectory()) {
        if (hasFormattableFiles(join(dir, entry.name))) return true;
      } else {
        const ext = entry.name.slice(entry.name.lastIndexOf("."));
        if (JS_TS_EXTENSIONS.has(ext)) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function createNodesInternal(
  configFile: string,
  options: OxfmtPluginOptions,
  context: CreateNodesContextV2,
) {
  const projectRoot = dirname(configFile);
  const fullProjectRoot = join(context.workspaceRoot, projectRoot);

  if (!existsSync(fullProjectRoot)) {
    return {};
  }

  if (!hasFormattableFiles(fullProjectRoot)) {
    return {};
  }

  const formatTargetName = options.formatTargetName ?? "format";
  const checkTargetName = options.checkTargetName ?? "format-check";

  const hasConfig = existsSync(join(fullProjectRoot, ".oxfmtrc.json"));
  const hasRootConfig = existsSync(join(context.workspaceRoot, ".oxfmtrc.json"));

  const configInputs: string[] = [];
  if (hasConfig) {
    configInputs.push(joinPathFragments("{projectRoot}", ".oxfmtrc.json"));
  }
  if (hasRootConfig) {
    configInputs.push(joinPathFragments("{workspaceRoot}", ".oxfmtrc.json"));
  }

  const sharedInputs = [
    ...configInputs,
    joinPathFragments("{projectRoot}", "**", "*"),
    { externalDependencies: ["oxfmt"] },
  ];

  const formatTarget: TargetConfiguration = {
    executor: "nx-oxfmt:format",
    options: {},
    cache: false,
    inputs: sharedInputs,
  };

  const checkTarget: TargetConfiguration = {
    executor: "nx-oxfmt:check",
    options: {},
    cache: true,
    inputs: sharedInputs,
  };

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [formatTargetName]: formatTarget,
          [checkTargetName]: checkTarget,
        },
      },
    },
  };
}

/**
 * Inferred targets plugin — automatically adds format and format-check
 * targets to projects that contain formattable files.
 */
export const createNodesV2: CreateNodesV2<OxfmtPluginOptions> = [
  "**/{project.json,package.json}",
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) => createNodesInternal(configFile, options ?? {}, context),
      configFiles,
      options,
      context,
    );
  },
];
