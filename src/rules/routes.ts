import type { RouteInfo } from "../types";
import { scanRoutesShared } from "./routeParser";

export async function scanRoutes(projectPath: string): Promise<RouteInfo[]> {
  const extracted = await scanRoutesShared(projectPath);
  return extracted.map((r) => ({
    method: r.method,
    path: r.path,
    file: r.file,
  }));
}
