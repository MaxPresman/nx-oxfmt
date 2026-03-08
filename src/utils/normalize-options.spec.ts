import { describe, it, expect } from "vitest";
import { buildOxfmtArgs } from "./normalize-options";

describe("buildOxfmtArgs", () => {
  const projectRoot = "/workspace/apps/my-app";
  const workspaceRoot = "/workspace";

  it("should default to project root when no patterns given", () => {
    const args = buildOxfmtArgs({}, projectRoot, workspaceRoot);
    expect(args).toEqual([projectRoot]);
  });

  it("should add --check flag", () => {
    const args = buildOxfmtArgs({ check: true }, projectRoot, workspaceRoot);
    expect(args).toContain("--check");
  });

  it("should add --config with full path", () => {
    const args = buildOxfmtArgs({ config: ".oxfmtrc.json" }, projectRoot, workspaceRoot);
    expect(args).toContain("--config");
    expect(args).toContain("/workspace/.oxfmtrc.json");
  });

  it("should add --no-error-on-unmatched-pattern", () => {
    const args = buildOxfmtArgs({ noErrorOnUnmatchedPattern: true }, projectRoot, workspaceRoot);
    expect(args).toContain("--no-error-on-unmatched-pattern");
  });

  it("should map patterns relative to project root", () => {
    const args = buildOxfmtArgs(
      { patterns: ["src/**/*.ts", "lib/**/*.ts"] },
      projectRoot,
      workspaceRoot,
    );
    expect(args).toContain("/workspace/apps/my-app/src/**/*.ts");
    expect(args).toContain("/workspace/apps/my-app/lib/**/*.ts");
  });
});
