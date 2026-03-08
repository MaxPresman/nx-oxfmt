import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveOxfmtBinary } from "./resolve-oxfmt";
import * as fs from "fs";
import * as childProcess from "child_process";

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return { ...actual, existsSync: vi.fn() };
});

vi.mock("child_process", async () => {
  const actual = await vi.importActual<typeof import("child_process")>("child_process");
  return { ...actual, execFileSync: vi.fn() };
});

describe("resolveOxfmtBinary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return local binary when it exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const result = resolveOxfmtBinary("/workspace");
    expect(result).toBe("/workspace/node_modules/.bin/oxfmt");
  });

  it("should fall back to global binary using which on unix", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(childProcess.execFileSync).mockReturnValue("/usr/local/bin/oxfmt\n" as any);

    const originalPlatform = process.platform;
    Object.defineProperty(process, "platform", { value: "linux" });

    const result = resolveOxfmtBinary("/workspace");
    expect(result).toBe("/usr/local/bin/oxfmt");
    expect(childProcess.execFileSync).toHaveBeenCalledWith("which", ["oxfmt"], {
      encoding: "utf-8",
    });

    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("should fall back to global binary using where on windows", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(childProcess.execFileSync).mockReturnValue(
      "C:\\Program Files\\oxfmt\\oxfmt.exe\n" as any,
    );

    const originalPlatform = process.platform;
    Object.defineProperty(process, "platform", { value: "win32" });

    const result = resolveOxfmtBinary("/workspace");
    expect(result).toBe("C:\\Program Files\\oxfmt\\oxfmt.exe");
    expect(childProcess.execFileSync).toHaveBeenCalledWith("where", ["oxfmt"], {
      encoding: "utf-8",
    });

    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("should throw when binary is not found", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(childProcess.execFileSync).mockImplementation(() => {
      throw new Error("not found");
    });

    expect(() => resolveOxfmtBinary("/workspace")).toThrow("Could not find oxfmt binary");
  });
});
