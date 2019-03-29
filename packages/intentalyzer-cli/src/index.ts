// tslint:disable:no-console

import * as yargs from "yargs";
import { startReplLoop } from "./commands/repl";
import { executeRunCommand } from "./commands/run";
import { executeTestCommand } from "./commands/test";

export * from "./intent-resolver-configuration";

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
        "run <config> <inputs> [output] [--maxUtterancesPerSecond 5]",
        "Takes a set of inputs and runs all of them through a specified configuration. The output format for this command is the same as the input file format. This command can be used to generate input files for use with the test command as well.",
        (y) => (y.positional(
                    "config",
                    {
                        describe: "The conversation configuration file to use for the run.",
                        type: "string",
                    })
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
                    }))
                .option("maxUtterancesPerSecond", {
                    alias: "mups",
                    number: true,
                    default: 5,
                    description: "The maximum number of utterances to process per second.",
                }),
        (argv) => executeRunCommand(argv.config as string, argv.inputs as string, argv.output as string, { maxUtterancesPerSecond: argv.maxUtterancesPerSecond }))
    .command(
        "test <config> <inputs> [output] [--diff] [--maxUtterancesPersecond 5]",
        "Takes a set of inputs and runs all of them through a specified configuration. This command includes additional output details such as execution timings as well as recognition diffs when the --diff switch is specified.",
        (y) => (y.positional(
                    "config",
                    {
                        describe: "The conversation configuration file to use for the run.",
                        type: "string",
                    })
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
                    })
                .option("maxUtterancesPerSecond", {
                    alias: "mups",
                    number: true,
                    default: 5,
                    description: "The maximum number of utterances to process per second.",
                })
                .option("diff", {
                    boolean: true,
                    default: false,
                    description: "Use this switch to enable diffing of expected results from the input file with actual results from the test run.",
                })),
        (argv) => executeTestCommand(argv.config as string, argv.inputs as string, argv.output as string, { outputDiff: argv.diff, maxUtterancesPerSecond: argv.maxUtterancesPerSecond }))
    .wrap(yargs.terminalWidth())
    .argv;
