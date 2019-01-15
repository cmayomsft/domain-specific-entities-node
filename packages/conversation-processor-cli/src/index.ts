// tslint:disable:no-console

import * as program from "commander";
import { createConversationProcessor } from "conversation-processor";
import * as inquirer from "inquirer";

// TODO: import some a specified configuration file that will define the conversationProcessor instance that will be used by the CLI

/*interface CpCommand {
    repl: boolean;
}

type CpCliProgram = program.Command & CpCommand;*/

const cpCliProgram = program
    .version("0.1.0");

cpCliProgram.command("repl")
    .description("Starts the CLI in REPL mode.")
    .action(() => startReplLoop());

cpCliProgram.command("run")
    .option("-i, --input", "A JSON file of utterances and, optionally, their expected results to test against.");

cpCliProgram.parse(process.argv);

async function startReplLoop() {
    console.log("Starting Conversation REPL...");

    const cp = createConversationProcessor({
        recognize: async (context, utterance) => {
            return {
                utterance,
                intent: "TODO-intent",
                entities: [],
            };
        }});

    do {
        const answer = await inquirer.prompt([{ name: "UtterancePrompt", type: "input", message: " ", prefix: ">" }]) as any;

        console.log(await cp.processUtterance({}, answer.UtterancePrompt));
    } while (true);
}

// TODO: REPL mode - start a REPL that just processes one utterance at a time and dumps the results

// TODO: Bulk execution mode - enumerate an input file of utterances and support outputting the results either to the output stream or to a specified file
