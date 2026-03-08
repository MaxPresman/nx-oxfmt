import { join } from "path";

export interface BaseOxfmtOptions {
  patterns?: string[];
  config?: string;
  noErrorOnUnmatchedPattern?: boolean;
}

export function buildOxfmtArgs(
  options: BaseOxfmtOptions & { check?: boolean },
  projectRoot: string,
  workspaceRoot: string,
): string[] {
  const args: string[] = [];

  if (options.check) {
    args.push("--check");
  }

  if (options.config) {
    args.push("--config", join(workspaceRoot, options.config));
  }

  if (options.noErrorOnUnmatchedPattern) {
    args.push("--no-error-on-unmatched-pattern");
  }

  // If patterns are provided use them, otherwise default to the project root
  const targets =
    options.patterns && options.patterns.length > 0
      ? options.patterns.map((p) => join(projectRoot, p))
      : [projectRoot];

  args.push(...targets);

  return args;
}
