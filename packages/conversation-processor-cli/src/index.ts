// tslint:disable:no-console

import * as yargs from "yargs";
import { startReplLoop } from "./repl";
import { runBatchProcessing } from "./run";

// tslint:disable-next-line:no-unused-expression
yargs
    .command(
        ["repl [config]", "$0"],
        "Starts the CLI in REPL mode.",
        (y) => (y.positional(
                "config",
                {
                    describe: "The conversation configuration file to start the REPL with.",
                    type: "string",
                })),
        (argv) => startReplLoop(argv.config as string))
    .command(
        "run <config> <inputs> [output]",
        "Takes a set of inputs and runs all of them through a specified configuration.",
        (y) => (y
                .positional(
                    "inputs",
                    {
                        alias: "i",
                        describe: "A path to a JSON file containing the inputs for the run.",
                        type: "string",
                    })
                .positional(
                    "output",
                    {
                        alias: "o",
                        describe: "A path to where an output file will be written for the run. If not supplied, output will be written to the console.",
                        type: "string",
                    })),
        (argv) => runBatchProcessing(argv.inputs as string, argv.output as string))
    .argv;

// "-c, --config [path]", "Path to the conversation configuration file to use.", void 0, ""; )
