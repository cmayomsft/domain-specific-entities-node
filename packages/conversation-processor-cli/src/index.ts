// tslint:disable:no-console

import * as program from "commander";
import { createConversationProcessor, IConversationProcessor } from "conversation-processor";
import * as inquirer from "inquirer";
import { ConversationProcessorConfiguration } from "./conversation-processor-configuration";

// TODO: import some a specified configuration file that will define the conversationProcessor instance that will be used by the CLI

interface CpCommand {
    config: string;
}

type CpCliProgram = program.Command & CpCommand;

const cpCliProgram = program
    .version("0.1.0") as CpCliProgram;

cpCliProgram.command("repl")
    .description("Starts the CLI in REPL mode.")
    .action(() => startReplLoop());

cpCliProgram.command("run")
    .description("Takes a set of inputs and runs all of them through a specified configuration.")
    .option("-i, --input", "A JSON file of utterances and, optionally, their expected results to test against.");

cpCliProgram.option("-c, --config [path]", "Path to the conversation configuration file to use.", void 0, "cp.config.js");

cpCliProgram.parse(process.argv);

async function startReplLoop() {
    console.log("Starting Conversation REPL...");

    const options = cpCliProgram.opts();
    const configFile = options.config;
    let cp: IConversationProcessor<any, any>|undefined;

    if (configFile) {
        console.log(`Loading conversation configuration from "${configFile}"...`);

        cp = await loadConverationProcessorFromConfiguration(cpCliProgram.config);

        if (!cp) {
            process.exit(-1);

            return;
        }
    } else {
        cp = createConversationProcessor({
            recognize: async (context, utterance) => {
                return {
                    utterance,
                    intent: "TODO-intent",
                    entities: [],
                };
            }});
    }

    do {
        const answer = await inquirer.prompt([{ name: "UtterancePrompt", type: "input", message: " ", prefix: ">" }]) as any;
        const utterance = answer.UtterancePrompt as string;

        if (utterance.startsWith("#")) {
            processReplCommand(utterance);
        } else {
            console.log(await cp.processUtterance({}, answer.UtterancePrompt));
        }
    } while (true);
}

async function loadConverationProcessorFromConfiguration(configFile: string) {
    const config = await import(configFile) as Partial<ConversationProcessorConfiguration>;

    if (!config.recognizers
            ||
        config.recognizers.length === 0) {
        console.log("No intent recognizers are configured.");

        return;
    }

    return createConversationProcessor(config.recognizers, ...(config.enrichers ? config.enrichers : []));
}

function processReplCommand(commandInput: string) {
    const commandSeparatorIndex = commandInput.indexOf(" ", 1);
    const command = commandInput.substring(1, commandSeparatorIndex);
    const commandParameters = commandInput.substring(commandSeparatorIndex + 1);

    switch (command) {
        case "config":
            processReplConfigCommand(commandParameters);
    }
}

function processReplConfigCommand(rawParameters: string) {
    console.log("TODO: trash currently loaded config and load a new one");
}

// TODO: REPL mode - start a REPL that just processes one utterance at a time and dumps the results

// TODO: Bulk execution mode - enumerate an input file of utterances and support outputting the results either to the output stream or to a specified file
