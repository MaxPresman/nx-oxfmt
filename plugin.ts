import { CreateNodesV2, CreateNodesResultV2, CreateNodesContextV2 } from "@nx/devkit";
import { existsSync } from "fs";
import { join, dirname } from "path";

/**
 * Inferred targets plugin — automatically adds `format` and `format-check`
 * targets to every project that has source files.
 */
export const createNodesV2: CreateNodesV2 = [
  "**/{project.json,package.json}",
  (
    configFiles: readonly string[],
    _options: unknown,
    context: CreateNodesContextV2,
  ): CreateNodesResultV2 => {
    const results: CreateNodesResultV2 = [];

    for (const configFile of configFiles) {
      const projectRoot = dirname(configFile);
      const fullProjectRoot = join(context.workspaceRoot, projectRoot);

      if (!existsSync(fullProjectRoot)) {
        continue;
      }

      results.push([
        configFile,
        {
          projects: {
            [projectRoot]: {
              targets: {
                format: {
                  executor: "nx-oxfmt:format",
                  options: {},
                  cache: false,
                },
                "format-check": {
                  executor: "nx-oxfmt:check",
                  options: {},
                  cache: true,
                  inputs: ["default"],
                },
              },
            },
          },
        },
      ]);
    }

    return results;
  },
];
