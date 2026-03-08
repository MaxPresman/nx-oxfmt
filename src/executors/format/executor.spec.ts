import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutorContext } from '@nx/devkit';
import { formatExecutor } from './executor';
import * as runOxfmtModule from '../../utils/run-oxfmt';

vi.mock('../../utils/run-oxfmt');

const mockRunOxfmt = vi.mocked(runOxfmtModule.runOxfmt);

const mockContext = {
  root: '/workspace',
  cwd: '/workspace',
  isVerbose: false,
  projectName: 'my-app',
  projectsConfigurations: {
    version: 2,
    projects: {
      'my-app': {
        root: 'apps/my-app',
        targets: {},
      },
    },
  },
  nxJsonConfiguration: {},
  projectGraph: { nodes: {}, dependencies: {} },
} as ExecutorContext;

describe('formatExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runOxfmt with correct params', async () => {
    mockRunOxfmt.mockReturnValue({ success: true });

    const result = await formatExecutor({}, mockContext);

    expect(mockRunOxfmt).toHaveBeenCalledWith({
      options: {},
      projectRoot: '/workspace/apps/my-app',
      workspaceRoot: '/workspace',
    });
    expect(result.success).toBe(true);
  });

  it('should pass patterns through to runOxfmt', async () => {
    mockRunOxfmt.mockReturnValue({ success: true });

    await formatExecutor({ patterns: ['src/**/*.ts'] }, mockContext);

    expect(mockRunOxfmt).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { patterns: ['src/**/*.ts'] },
      })
    );
  });

  it('should return failure when runOxfmt fails', async () => {
    mockRunOxfmt.mockReturnValue({ success: false });

    const result = await formatExecutor({}, mockContext);
    expect(result.success).toBe(false);
  });
});
