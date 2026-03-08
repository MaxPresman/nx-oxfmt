import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveOxfmtBinary } from './resolve-oxfmt';
import * as fs from 'fs';
import * as childProcess from 'child_process';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return { ...actual, existsSync: vi.fn() };
});

vi.mock('child_process', async () => {
  const actual =
    await vi.importActual<typeof import('child_process')>('child_process');
  return { ...actual, execSync: vi.fn() };
});

describe('resolveOxfmtBinary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return local binary when it exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const result = resolveOxfmtBinary('/workspace');
    expect(result).toBe('/workspace/node_modules/.bin/oxfmt');
  });

  it('should fall back to global binary', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(childProcess.execSync).mockReturnValue(
      '/usr/local/bin/oxfmt\n' as any
    );

    const result = resolveOxfmtBinary('/workspace');
    expect(result).toBe('/usr/local/bin/oxfmt');
  });

  it('should throw when binary is not found', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(childProcess.execSync).mockImplementation(() => {
      throw new Error('not found');
    });

    expect(() => resolveOxfmtBinary('/workspace')).toThrow(
      'Could not find oxfmt binary'
    );
  });
});
