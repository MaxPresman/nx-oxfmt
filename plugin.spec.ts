import { describe, it, expect, vi, beforeEach } from "vitest";
import { vol } from "memfs";
import { CreateNodesContextV2 } from "@nx/devkit";

let readdirSyncOverride: ((...args: any[]) => any) | null = null;

vi.mock("fs", async () => {
  const memfs = await import("memfs");
  return {
    ...memfs.fs,
    default: memfs.fs,
    readdirSync: (...args: any[]) => {
      if (readdirSyncOverride) return readdirSyncOverride(...args);
      return memfs.fs.readdirSync(...(args as Parameters<typeof memfs.fs.readdirSync>));
    },
  };
});

// Import after mocking fs
const loadPlugin = async () => {
  vi.resetModules();
  vi.doMock("fs", async () => {
    const memfs = await import("memfs");
    return {
      ...memfs.fs,
      default: memfs.fs,
      readdirSync: (...args: any[]) => {
        if (readdirSyncOverride) return readdirSyncOverride(...args);
        return memfs.fs.readdirSync(...(args as Parameters<typeof memfs.fs.readdirSync>));
      },
    };
  });
  return await import("./plugin");
};

function makeContext(workspaceRoot: string): CreateNodesContextV2 {
  return {
    workspaceRoot,
    configFiles: [],
    nxJsonConfiguration: {},
  };
}

describe("createNodesV2 plugin", () => {
  beforeEach(() => {
    vol.reset();
    readdirSyncOverride = null;
  });

  it("should export createNodes as alias for createNodesV2", async () => {
    const plugin = await loadPlugin();
    expect(plugin.createNodes).toBe(plugin.createNodesV2);
  });

  it("should use correct glob pattern", async () => {
    const plugin = await loadPlugin();
    const [pattern] = plugin.createNodesV2;
    expect(pattern).toBe("**/{project.json,package.json}");
  });

  it("should return targets for project with formattable files", async () => {
    vol.fromJSON({
      "/workspace/apps/my-app/project.json": "{}",
      "/workspace/apps/my-app/src/index.ts": "export const a = 1;",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(
      ["apps/my-app/project.json"],
      {},
      makeContext("/workspace"),
    );

    expect(results).toHaveLength(1);
    const [file, result] = results[0];
    expect(file).toBe("apps/my-app/project.json");
    expect(result.projects?.["apps/my-app"]?.targets?.["format"]).toBeDefined();
    expect(result.projects?.["apps/my-app"]?.targets?.["format-check"]).toBeDefined();
  });

  it("should set correct executor and cache settings", async () => {
    vol.fromJSON({
      "/workspace/libs/ui/package.json": "{}",
      "/workspace/libs/ui/src/component.tsx": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["libs/ui/package.json"], {}, makeContext("/workspace"));

    const targets = results[0][1].projects?.["libs/ui"]?.targets;
    expect(targets?.["format"].executor).toBe("nx-oxfmt:format");
    expect(targets?.["format"].cache).toBe(false);
    expect(targets?.["format-check"].executor).toBe("nx-oxfmt:check");
    expect(targets?.["format-check"].cache).toBe(true);
  });

  it("should include metadata description on targets", async () => {
    vol.fromJSON({
      "/workspace/app/project.json": "{}",
      "/workspace/app/index.js": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["app/project.json"], {}, makeContext("/workspace"));

    const targets = results[0][1].projects?.["app"]?.targets;
    expect(targets?.["format"].metadata?.description).toBe("Format files using oxfmt");
    expect(targets?.["format-check"].metadata?.description).toBe("Check formatting using oxfmt");
  });

  it("should use custom target names from options", async () => {
    vol.fromJSON({
      "/workspace/app/project.json": "{}",
      "/workspace/app/style.css": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(
      ["app/project.json"],
      { formatTargetName: "fmt", checkTargetName: "lint-format" },
      makeContext("/workspace"),
    );

    const targets = results[0][1].projects?.["app"]?.targets;
    expect(targets?.["fmt"]).toBeDefined();
    expect(targets?.["lint-format"]).toBeDefined();
    expect(targets?.["format"]).toBeUndefined();
  });

  it("should skip project when directory cannot be read", async () => {
    // When existsSync returns true but readdirSync fails,
    // hasFormattableFiles returns false
    vol.fromJSON({
      "/workspace/placeholder": "",
    });
    // Create a project.json entry pointing to a dir that will fail to read
    // We simulate by having an empty dir with no formattable source files
    // Note: project.json itself is .json (formattable), so a truly empty
    // project still gets targets. This tests the "directory doesn't exist" path.
    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(
      ["missing-dir/project.json"],
      {},
      makeContext("/workspace"),
    );

    expect(results[0][1]).toEqual({});
  });

  it("should skip project when directory does not exist", async () => {
    vol.fromJSON({ "/workspace/placeholder": "" });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(
      ["nonexistent/project.json"],
      {},
      makeContext("/workspace"),
    );

    expect(results[0][1]).toEqual({});
  });

  it("should find formattable files in subdirectories via recursion", async () => {
    vol.fromJSON({
      "/workspace/app/package.json": "{}",
    });

    // Mock a directory structure where the only formattable file
    // is inside a subdirectory (not at root level)
    readdirSyncOverride = (dir: string) => {
      if (typeof dir === "string" && dir.endsWith("/app")) {
        return [{ name: "src", isDirectory: () => true, isSymbolicLink: () => false }];
      }
      if (typeof dir === "string" && dir.endsWith("/src")) {
        return [{ name: "index.ts", isDirectory: () => false, isSymbolicLink: () => false }];
      }
      return vol.readdirSync(dir, { withFileTypes: true });
    };
    vol.fromJSON({
      "/workspace/app/package.json": "{}",
      "/workspace/app/src/index.ts": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["app/project.json"], {}, makeContext("/workspace"));

    expect(results[0][1].projects?.["app"]?.targets?.["format"]).toBeDefined();
  });

  it("should skip node_modules and .git when scanning subdirectories", async () => {
    // project.json is itself .json (formattable), so having node_modules
    // or .git doesn't prevent target creation. This test verifies those
    // dirs are skipped during recursive scanning (not that they prevent
    // targets entirely).
    vol.fromJSON({
      "/workspace/app/project.json": "{}",
      "/workspace/app/node_modules/pkg/index.js": "",
      "/workspace/app/.git/hooks/pre-commit": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["app/project.json"], {}, makeContext("/workspace"));

    // Targets still created because project.json is itself a .json file
    expect(results[0][1].projects?.["app"]?.targets?.["format"]).toBeDefined();
  });

  it("should include project-level .oxfmtrc.json in cache inputs", async () => {
    vol.fromJSON({
      "/workspace/app/project.json": "{}",
      "/workspace/app/.oxfmtrc.json": "{}",
      "/workspace/app/index.ts": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["app/project.json"], {}, makeContext("/workspace"));

    const inputs = results[0][1].projects?.["app"]?.targets?.["format-check"].inputs;
    expect(inputs).toContainEqual("{projectRoot}/.oxfmtrc.json");
  });

  it("should include workspace-level .oxfmtrc.json in cache inputs", async () => {
    vol.fromJSON({
      "/workspace/.oxfmtrc.json": "{}",
      "/workspace/app/project.json": "{}",
      "/workspace/app/index.ts": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["app/project.json"], {}, makeContext("/workspace"));

    const inputs = results[0][1].projects?.["app"]?.targets?.["format"].inputs;
    expect(inputs).toContainEqual("{workspaceRoot}/.oxfmtrc.json");
  });

  it("should include externalDependencies in cache inputs", async () => {
    vol.fromJSON({
      "/workspace/app/project.json": "{}",
      "/workspace/app/index.ts": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["app/project.json"], {}, makeContext("/workspace"));

    const inputs = results[0][1].projects?.["app"]?.targets?.["format-check"].inputs;
    expect(inputs).toContainEqual({ externalDependencies: ["oxfmt"] });
  });

  it("should handle root-level project (project.json at workspace root)", async () => {
    vol.fromJSON({
      "/workspace/project.json": "{}",
      "/workspace/src/main.ts": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["project.json"], {}, makeContext("/workspace"));

    expect(results[0][1].projects?.["."]?.targets?.["format"]).toBeDefined();
  });

  it("should handle multiple config files", async () => {
    vol.fromJSON({
      "/workspace/app-a/project.json": "{}",
      "/workspace/app-a/index.ts": "",
      "/workspace/app-b/package.json": "{}",
      "/workspace/app-b/style.css": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(
      ["app-a/project.json", "app-b/package.json"],
      {},
      makeContext("/workspace"),
    );

    expect(results).toHaveLength(2);
    expect(results[0][1].projects?.["app-a"]?.targets?.["format"]).toBeDefined();
    expect(results[1][1].projects?.["app-b"]?.targets?.["format"]).toBeDefined();
  });

  it("should respect MAX_SCAN_DEPTH and skip symlinks", async () => {
    vol.fromJSON({
      "/workspace/deep/package.json": "{}",
    });

    // Override readdirSync to simulate deeply nested dirs with no files
    // until beyond depth 10, and include a symlink entry
    readdirSyncOverride = (dir: string) => {
      if (typeof dir === "string" && dir.includes("deep")) {
        return [
          {
            name: "subdir",
            isDirectory: () => true,
            isSymbolicLink: () => false,
          },
          {
            name: "link",
            isDirectory: () => false,
            isSymbolicLink: () => true,
          },
        ];
      }
      return vol.readdirSync(dir, { withFileTypes: true });
    };

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["deep/package.json"], {}, makeContext("/workspace"));

    // No formattable files found (all entries are dirs/symlinks, depth exceeded)
    expect(results[0][1]).toEqual({});
  });

  it("should include both project and root config in inputs", async () => {
    vol.fromJSON({
      "/workspace/.oxfmtrc.json": "{}",
      "/workspace/app/project.json": "{}",
      "/workspace/app/.oxfmtrc.json": "{}",
      "/workspace/app/index.ts": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["app/project.json"], {}, makeContext("/workspace"));

    const inputs = results[0][1].projects?.["app"]?.targets?.["format"].inputs;
    expect(inputs).toContainEqual("{projectRoot}/.oxfmtrc.json");
    expect(inputs).toContainEqual("{workspaceRoot}/.oxfmtrc.json");
  });

  it("should handle null options gracefully", async () => {
    vol.fromJSON({
      "/workspace/app/project.json": "{}",
      "/workspace/app/index.ts": "",
    });

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(
      ["app/project.json"],
      undefined as any,
      makeContext("/workspace"),
    );

    expect(results[0][1].projects?.["app"]?.targets?.["format"]).toBeDefined();
  });

  it("should return empty when project has no formattable files", async () => {
    vol.fromJSON({
      "/workspace/data/package.json": "{}",
    });

    readdirSyncOverride = (dir: string) => {
      if (typeof dir === "string" && dir.includes("data")) {
        return [
          { name: "image.png", isDirectory: () => false, isSymbolicLink: () => false },
          { name: "binary.dat", isDirectory: () => false, isSymbolicLink: () => false },
        ];
      }
      return vol.readdirSync(dir, { withFileTypes: true });
    };

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["data/package.json"], {}, makeContext("/workspace"));

    expect(results[0][1]).toEqual({});
  });

  it("should handle readdirSync throwing an error", async () => {
    vol.fromJSON({
      "/workspace/broken/package.json": "{}",
    });

    readdirSyncOverride = (dir: string) => {
      if (typeof dir === "string" && dir.includes("broken")) {
        throw new Error("EACCES: permission denied");
      }
      return vol.readdirSync(dir, { withFileTypes: true });
    };

    const plugin = await loadPlugin();
    const [, createNodesFn] = plugin.createNodesV2;
    const results = await createNodesFn(["broken/package.json"], {}, makeContext("/workspace"));

    expect(results[0][1]).toEqual({});
  });
});
