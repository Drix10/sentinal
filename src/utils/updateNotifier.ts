import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import chalk from "chalk";

const CACHE_FILE = path.join(os.homedir(), ".sentinel", "update_cache.json");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

interface CacheData {
  lastChecked: number;
  latestVersion: string;
}

function semverGt(v1: string, v2: string): boolean {
  const p1 = v1.split("-")[0].replace(/^v/, "").split(".").map(Number);
  const p2 = v2.split("-")[0].replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = isNaN(p1[i]) ? 0 : p1[i];
    const n2 = isNaN(p2[i]) ? 0 : p2[i];
    if (n1 > n2) return true;
    if (n1 < n2) return false;
  }
  return false;
}

export async function checkUpdateNotifier(currentVersion: string): Promise<void> {
  try {
    const sentinelDir = path.join(os.homedir(), ".sentinel");
    if (!fs.existsSync(sentinelDir)) {
      fs.mkdirSync(sentinelDir, { recursive: true });
    }

    let cache: CacheData | null = null;
    if (fs.existsSync(CACHE_FILE)) {
      try {
        cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
      } catch {
        cache = null;
      }
    }

    const now = Date.now();
    if (cache && now - cache.lastChecked < CHECK_INTERVAL_MS) {
      if (cache.latestVersion && semverGt(cache.latestVersion, currentVersion)) {
        displayUpdateBox(currentVersion, cache.latestVersion);
      }
      return;
    }

    await new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      const req = https.get(
        "https://registry.npmjs.org/sentinel-ai-cli/latest",
        { headers: { "User-Agent": "sentinel-ai-cli" }, timeout: 1500 },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            done();
            return;
          }

          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const data = JSON.parse(body);
              const latestVersion = data.version;
              if (latestVersion) {
                const newCache: CacheData = { lastChecked: now, latestVersion };
                fs.writeFileSync(CACHE_FILE, JSON.stringify(newCache), "utf8");
                if (semverGt(latestVersion, currentVersion)) {
                  displayUpdateBox(currentVersion, latestVersion);
                }
              }
            } catch {
            } finally {
              done();
            }
          });

          res.on("error", () => done());
        },
      );

      req.on("error", () => done());
      req.on("timeout", () => {
        req.destroy();
        done();
      });
    });
  } catch {
  }
}

function displayUpdateBox(current: string, latest: string): void {
  console.log();
  console.log(chalk.yellow(` 💡 Update available: ${chalk.dim(current)} → ${chalk.green.bold(latest)}`));
  console.log(chalk.yellow(`    Run ${chalk.cyan("npm install -g sentinel-ai-cli")} to update.`));
  console.log();
}
