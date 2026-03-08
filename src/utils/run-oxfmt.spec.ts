import { describe, it, expect, vi, beforeEach } from "vitest";
import { runOxfmt } from "./run-oxfmt";
import * as childProcess from "child_process";

vi.mock("child_process", async () => {
  const actual = await vi.importActual<typeof import("child_process")>("child_process");
  return { ...actual, execFileSync: vi.fn() };
});

vi.mock("./resolve-oxfmt", () => ({
  resolveOxfmtBinary: vi.fn(() => "/usr/local/bin/oxfmt"),
}));

describe("runOxfmt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should run oxfmt with execFileSync and return success", () => {
    const result = runOxfmt({
      options: {},
      projectRoot: "/workspace/apps/my-app",
      workspaceRoot: "/workspace",
    });

    expect(childProcess.execFileSync).toHaveBeenCalledWith(
      "/usr/local/bin/oxfmt",
      ["/workspace/apps/my-app"],
      expect.objectContaining({ cwd: "/workspace", stdio: "inherit" }),
    );
    expect(result.success).toBe(true);
  });

  it("should return failure when execFileSync throws", () => {
    vi.mocked(childProcess.execFileSync).mockImplementation(() => {
      throw new Error("failed");
    });

    const result = runOxfmt({
      options: {},
      projectRoot: "/workspace/apps/my-app",
      workspaceRoot: "/workspace",
    });

    expect(result.success).toBe(false);
  });

  it("should pass --check flag when check is true", () => {
    runOxfmt({
      options: { check: true },
      projectRoot: "/workspace/apps/my-app",
      workspaceRoot: "/workspace",
    });

    expect(childProcess.execFileSync).toHaveBeenCalledWith(
      "/usr/local/bin/oxfmt",
      expect.arrayContaining(["--check"]),
      expect.anything(),
    );
  });
});
