/**
 * Normalizes file paths across operating systems (converting Windows backslashes to POSIX forward slashes).
 */
export function normalizePath(filePath: string): string {
  if (!filePath) return "";
  return filePath.replace(/\\/g, "/");
}
