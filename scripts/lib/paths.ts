import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function publicPathToFilePath(publicPath: string): string {
  return resolve(projectRoot, "public", publicPath.replace(/^\/+/, ""));
}
