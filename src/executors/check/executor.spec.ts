import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutorContext } from '@nx/devkit';
import { checkExecutor } from './executor';
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

describe('checkExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runOxfmt with check: true', async () => {
    mockRunOxfmt.mockReturnValue({ success: true });

    const result = await checkExecutor({}, mockContext);

    expect(mockRunOxfmt).toHaveBeenCalledWith({
      options: { check: true },
      projectRoot: '/workspace/apps/my-app',
      workspaceRoot: '/workspace',
    });
    expect(result.success).toBe(true);
  });

  it('should return failure when files are unformatted', async () => {
    mockRunOxfmt.mockReturnValue({ success: false });

    const result = await checkExecutor({}, mockContext);
    expect(result.success).toBe(false);
  });
});
