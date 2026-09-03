import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

function normalizeBase(value) {
  if (!value || value === "/") return "/";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
const repositoryOwner = process.env.GITHUB_REPOSITORY_OWNER;
const siteUrl =
  process.env.PUBLIC_SITE_URL ??
  (repositoryOwner ? `https://${repositoryOwner}.github.io` : undefined);
const base = normalizeBase(
  process.env.PUBLIC_BASE ?? repositoryName ?? "OneMonthOneGame",
);

const config = {
  output: "static",
  base,
  vite: {
    plugins: [tailwindcss()],
  },
};

if (siteUrl) config.site = siteUrl;

export default defineConfig(config);
