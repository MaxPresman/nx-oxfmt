export interface InitGeneratorSchema {
  skipInstall?: boolean;
  migratePrettier?: boolean;
  oxfmtVersion?: string;
  formatTargetName?: string;
  checkTargetName?: string;
}
