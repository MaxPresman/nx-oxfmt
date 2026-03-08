import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree, readJson, writeJson } from "@nx/devkit";
import { initGenerator } from "./generator";

vi.mock("child_process", async () => {
  const actual = await vi.importActual<typeof import("child_process")>("child_process");
  return {
    ...actual,
    execSync: vi.fn(() => Buffer.from("")),
  };
});

describe("init generator", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    vi.clearAllMocks();
  });

  it("should add oxfmt as a dev dependency", async () => {
    await initGenerator(tree, {});

    const packageJson = readJson(tree, "package.json");
    expect(packageJson.devDependencies["oxfmt"]).toBeDefined();
  });

  it("should create .oxfmtrc.json", async () => {
    await initGenerator(tree, {});

    expect(tree.exists(".oxfmtrc.json")).toBe(true);
  });

  it("should not overwrite existing .oxfmtrc.json", async () => {
    tree.write(".oxfmtrc.json", '{"printWidth": 80}');

    await initGenerator(tree, {});

    const config = tree.read(".oxfmtrc.json", "utf-8");
    expect(config).toContain('"printWidth": 80');
  });

  it("should skip install when skipInstall is true", async () => {
    await initGenerator(tree, { skipInstall: true });

    const packageJson = readJson(tree, "package.json");
    expect(packageJson.devDependencies?.["oxfmt"]).toBeUndefined();
  });

  it("should call migrate when migratePrettier is true", async () => {
    const { execSync } = await import("child_process");

    await initGenerator(tree, { migratePrettier: true });

    expect(execSync).toHaveBeenCalledWith("npx oxfmt --migrate prettier", expect.anything());
  });

  it("should warn when prettier migration fails", async () => {
    const { execSync } = await import("child_process");
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("migration failed");
    });

    await initGenerator(tree, { migratePrettier: true });
  });

  it("should use specified oxfmtVersion", async () => {
    await initGenerator(tree, { oxfmtVersion: "0.35.0" });

    const packageJson = readJson(tree, "package.json");
    expect(packageJson.devDependencies["oxfmt"]).toBe("0.35.0");
  });

  it("should register plugin in nx.json with defaults", async () => {
    await initGenerator(tree, {});

    const nxJson = readJson(tree, "nx.json");
    expect(nxJson.plugins).toContain("nx-oxfmt/plugin");
  });

  it("should register plugin with custom target names", async () => {
    await initGenerator(tree, { formatTargetName: "fmt", checkTargetName: "fmt-check" });

    const nxJson = readJson(tree, "nx.json");
    expect(nxJson.plugins).toContainEqual({
      plugin: "nx-oxfmt/plugin",
      options: { formatTargetName: "fmt", checkTargetName: "fmt-check" },
    });
  });

  it("should not duplicate plugin registration", async () => {
    await initGenerator(tree, {});
    await initGenerator(tree, {});

    const nxJson = readJson(tree, "nx.json");
    const pluginEntries = nxJson.plugins.filter(
      (p: string | { plugin: string }) =>
        p === "nx-oxfmt/plugin" || (typeof p === "object" && p.plugin === "nx-oxfmt/plugin"),
    );
    expect(pluginEntries).toHaveLength(1);
  });

  it("should not duplicate when already registered as object", async () => {
    const nxJson = readJson(tree, "nx.json");
    nxJson.plugins = [{ plugin: "nx-oxfmt/plugin", options: {} }];
    writeJson(tree, "nx.json", nxJson);

    await initGenerator(tree, {});

    const updated = readJson(tree, "nx.json");
    expect(updated.plugins).toHaveLength(1);
  });

  it("should handle missing nx.json gracefully", async () => {
    tree.delete("nx.json");

    await initGenerator(tree, {});

    expect(tree.exists("nx.json")).toBe(false);
  });
});
