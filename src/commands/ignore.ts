import { FindingStore } from "../findings/findingStore.js";
import { colors, renderBanner } from "../ui/render.js";

export async function ignoreCommand(findingId?: string, reason?: string) {
  renderBanner();

  if (!findingId) {
    console.log(colors.critical(" ✖ Error: Finding ID required."));
    console.log(colors.medium("   Example: sentinel ignore FINDING-100 --reason 'Mitigated by WAF'\n"));
    process.exit(1);
  }

  const projectPath = process.cwd();
  const store = new FindingStore();
  const loaded = store.loadFromProject(projectPath);

  if (!loaded) {
    console.log(colors.medium(" ⚠️ No scan findings found in current directory. Run 'sentinel attack .' first.\n"));
    process.exit(1);
  }

  const id = findingId.toUpperCase();
  const finding = store.getFinding(id);

  if (!finding) {
    console.log(colors.critical(` ✖ Finding not found: ${findingId}`));
    process.exit(1);
  }

  const ignoreReason = reason || "Ignored by developer";
  store.updateStatus(id, "IGNORED", ignoreReason);
  store.saveToProject(projectPath);

  console.log(colors.medium(` ✔ Finding ${id} marked as IGNORED.`));
  console.log(colors.gray(`   Reason: ${ignoreReason}\n`));
}
