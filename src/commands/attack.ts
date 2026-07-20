import chalk from "chalk";
import ora from "ora";

import { runAttack } from "../core/orchestrator";

export async function attackCommand() {
    console.clear();
    console.log(chalk.red.bold(`SENTINAL`));

    console.log(chalk.grey("AI Secuirty Review Agent\n"));

    const spinner = ora("Starting attack analysis...").start();

    await runAttack(spinner);
}

