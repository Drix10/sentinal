import chalk from "chalk";

const cyan = chalk.hex("#00F5FF").bold;
const white = chalk.white.bold;
const dim = chalk.gray;
const green = chalk.hex("#00FF88").bold;

function printPostInstallBanner() {
  console.log(
    cyan(`
 ╔══════════════════════════════════════════════════════════════════════╗
 ║      S E N T I N E L   A I   S E C U R I T Y   P L A T F O R M       ║
 ║      Deterministic Program Analysis • Attack Graph • AI Reasoning    ║
 ╚══════════════════════════════════════════════════════════════════════╝
`),
  );

  console.log(green(" [+] Sentinel AI CLI Installed Successfully!\n"));

  console.log(cyan("┌── [!] QUICK START DEVELOPER GUIDE ─────────────────────────────────────┐"));
  console.log(cyan("│") + white("  1. Configure Gemini AI Key:                                          ") + cyan("│"));
  console.log(cyan("│") + dim("     sentinel set-key <YOUR_GEMINI_API_KEY>                            ") + cyan("│"));
  console.log(cyan("│") + white("  2. Run Security Attack Scan on Target Project:                       ") + cyan("│"));
  console.log(cyan("│") + dim("     sentinel attack .                                                 ") + cyan("│"));
  console.log(cyan("│") + white("  3. Explain Finding Root Cause with AI Reasoning:                     ") + cyan("│"));
  console.log(cyan("│") + dim("     sentinel explain FINDING-100                                      ") + cyan("│"));
  console.log(cyan("│") + white("  4. Synthesize Autonomous AI Code Fix:                                ") + cyan("│"));
  console.log(cyan("│") + dim("     sentinel fix FINDING-100                                          ") + cyan("│"));
  console.log(cyan("│") + white("  5. Triage & Ignore Accepted Risk:                                    ") + cyan("│"));
  console.log(cyan("│") + dim("     sentinel ignore FINDING-100 --reason \"Audited by AppSec\"           ") + cyan("│"));
  console.log(cyan("└────────────────────────────────────────────────────────────────────────┘\n"));
}

try {
  printPostInstallBanner();
} catch {
  // Silent catch if installed in restricted stdout environments
}
