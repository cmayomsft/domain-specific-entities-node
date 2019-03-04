// tslint:disable:no-console

import { IIntentResolver } from "conversation-processor";
import * as inquirer from "inquirer";
import * as util from "util";
import { loadIntentResolverFromConfiguration } from "../conversation-processor-configuration";

let intentResolver: IIntentResolver<any, any>|undefined;
let currentConfigFile: string|undefined;

export async function startReplLoop(configFile?: string) {
    console.log("Starting Conversation REPL...");

    if (configFile) {
        processReplConfigurationCommand(configFile);
    }

    do {
        const answer = await inquirer.prompt([{ name: "UtterancePrompt", type: "input", message: " ", prefix: ">" }]) as any;
        const utterance = answer.UtterancePrompt as string;

        if (utterance.startsWith("#")) {
            await processReplCommand(utterance);
        } else {
            if (intentResolver) {
                const recognizedUtterance = await intentResolver.processUtterance({}, answer.UtterancePrompt);

                console.log(util.inspect(recognizedUtterance, false, null, true));
            } else {
                console.log("ERROR: No conversation processor currently loaded. Please use the #config command to load a configuration.");
            }
        }
    } while (true);
}

async function processReplCommand(commandInput: string) {
    const commandSeparatorIndex = commandInput.indexOf(" ", 1);

    let command: string;
    let commandParameters: string|null;

    if (commandSeparatorIndex !== -1) {
        command = commandInput.substring(1, commandSeparatorIndex);
        commandParameters = commandInput.substring(commandSeparatorIndex + 1);
    } else {
        command = commandInput.substring(1);
        commandParameters = null;
    }

    switch (command) {
        case "reload":
            await processReplReloadCommand();

            break;

        case "config":
            await processReplConfigurationCommand(commandParameters);

            break;

        default:
            console.warn(`${command} is not recognized as a known REPL command.`);

            break;
    }
}

async function processReplReloadCommand() {
    if (!currentConfigFile) {
        console.error("ERROR: No configuration is currently loaded; use #config to load one.");

        return;
    }

    console.log(`Reloading configuration from ${currentConfigFile}...`);

    try {
        intentResolver = await loadIntentResolverFromConfiguration(currentConfigFile);
    } catch (error) {
        console.error("Failed to reload configuration: ", error);

        return;
    }

    console.log(`Configuration reloaded!`);
}

async function processReplConfigurationCommand(configFile: string|null) {
    if (!configFile) {
        console.error("No configuration file specified.");

        return;
    }

    console.log(`Loading conversation configuration from "${configFile}"...`);

    try {
        intentResolver = await loadIntentResolverFromConfiguration(configFile);
    } catch (error) {
        console.error("ERROR: Could not load conversation processor from specified configuration file.", error);

        return;
    }

    currentConfigFile = configFile;
}
