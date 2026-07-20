import chalk from "chalk";
import type { Ora } from "ora";

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runAttack(spinner: Ora) {
    spinner.text = "Detecting project...";
    await delay(1000);
    spinner.succeed("Project Detected");

    console.log(chalk.cyan("\nTEST"));

}