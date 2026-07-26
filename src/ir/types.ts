/**
 * Sentinel Intermediate Representation (IR) Specification
 * Language-agnostic abstraction for source code entities across TypeScript, Python, Go, Rust, Java.
 */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "CONNECT"
  | "TRACE"
  | "ALL"
  | "USE";

export interface IRPosition {
  line: number;
  column: number;
}

export interface IRLocation {
  filePath: string;
  start: IRPosition;
  end: IRPosition;
}

export interface IRVariable {
  id: string;
  name: string;
  type?: string;
  isConstant: boolean;
  value?: string;
  isTainted: boolean;
  location: IRLocation;
}

export interface IRParameter {
  name: string;
  type?: string;
  defaultValue?: string;
}

export interface IRFunction {
  id: string;
  name: string;
  filePath: string;
  parameters: IRParameter[];
  returnType?: string;
  isAsync: boolean;
  decorators: string[];
  location: IRLocation;
  calls: string[];
}

export interface IRRoute {
  id: string;
  method: HttpMethod;
  path: string;
  filePath: string;
  handlerName?: string;
  middlewareChain: string[];
  location: IRLocation;
}

export interface IRCallSite {
  id: string;
  callerFunctionId?: string;
  targetName: string;
  arguments: string[];
  location: IRLocation;
}

export interface IRFile {
  filePath: string;
  language: string;
  functions: IRFunction[];
  routes: IRRoute[];
  variables: IRVariable[];
  callSites: IRCallSite[];
  imports: string[];
}

export interface IRProject {
  name: string;
  rootPath: string;
  language: string;
  framework: string;
  packageManager: string;
  files: Map<string, IRFile>;
}
