// tslint:disable:no-console

import * as program from "commander";
import { startReplLoop } from "./repl";
import { runBatchProcessing } from "./run";

export interface CpCommand {
    config: string;
}

export type CpCliProgram = program.Command & CpCommand;

const cpCliProgram = program
    .version("0.1.0") as CpCliProgram;

cpCliProgram.command("repl")
    .description("Starts the CLI in REPL mode.")
    .action(() => startReplLoop(cpCliProgram.opts().config));

cpCliProgram.command("run")
    .description("Takes a set of inputs and runs all of them through a specified configuration.")
    .option("-i, --input", "A JSON file of utterances and, optionally, their expected results to test against.")
    .action(() => runBatchProcessing(cpCliProgram));

cpCliProgram.option("-c, --config [path]", "Path to the conversation configuration file to use.", void 0, "cp.config.js");

cpCliProgram.parse(process.argv);
