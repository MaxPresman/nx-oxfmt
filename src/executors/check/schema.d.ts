export interface CheckExecutorSchema {
  patterns?: string[];
  config?: string;
  noErrorOnUnmatchedPattern?: boolean;
  additionalArgs?: string[];
}
