export interface ProjectInfo {
  name: string;
  framework: string;
  language: string;
  packageManager: string;

  hasDocker: boolean;
  hasEnv: boolean;
  hasGit: boolean;

  sourceDirectory: string;
}

export interface RouteInfo {
  method: string;
  path: string;
  file: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: "dependency" | "devDependency";
}

export interface SecretFinding {
  type: string;
  value: string;
  file: string;
  line: number;
}

export interface ProjectAnalysis {
  project: ProjectInfo;
  routes: RouteInfo[];
  dependencies: DependencyInfo[];
  secrets: SecretFinding[];
}
