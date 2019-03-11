// tslint:disable:no-console

import chalk from "chalk";
import { IIntentResolver } from "conversation-processor";
import * as repl from "repl";
import * as util from "util";
import { Context } from "vm";
import { loadIntentResolverFromConfiguration } from "../intent-resolver-configuration";

let intentResolver: IIntentResolver<any, any>|undefined;
let currentConfigFile: string|undefined;

export async function startReplLoop(configFile?: string) {
    console.log("Starting Conversation REPL...");

    if (configFile) {
        processReplConfigurationCommand(configFile);
    }

    const replServer = repl.start({
        eval: async (cmd: string, context: Context, file: string, callback: (err: Error | null, result: any) => void) => {
            if (intentResolver) {
                try {
                    const recognizedUtterance = await intentResolver.processUtterance({}, cmd);

                    console.log(util.inspect(
                        recognizedUtterance, {
                            colors: true,
                            depth: 10,
                        }));

                    callback(null, undefined);
                } catch (error) {
                    callback(new repl.Recoverable(error), undefined);
                }
            } else {
                console.error(chalk`{redBright ERROR: No configuration is currently loaded. Please use the {gray .config} command to load a specific configuration.}`);
            }
        },
        writer: (text) => {
            if (text) {
                return text;
            }
        },
        useColors: true,
        prompt: chalk`intent {green.bold >} `,
        ignoreUndefined: true,
    });

    replServer.defineCommand("config", {
        action: processReplConfigurationCommand,
        help: "Loads the specified configuration file.",
    });

    replServer.defineCommand("reload", {
        action: processReplReloadCommand,
        help: "Reloads the current configuration file.",
    });
}

async function processReplReloadCommand() {
    if (!currentConfigFile) {
        console.error(chalk`{redBright ERROR: No configuration is currently loaded; use {gray .config} to load one.}`);

        return;
    }

    console.log(chalk`Reloading configuration from {blueBright ${currentConfigFile}}...`);

    try {
        intentResolver = await loadIntentResolverFromConfiguration(currentConfigFile);
    } catch (error) {
        console.error(chalk`{redBright Failed to reload configuration: }`, error);

        return;
    }

    console.log(`Configuration reloaded!`);
}

async function processReplConfigurationCommand(configFile: string|null) {
    if (!configFile) {
        console.error(chalk`{redBright No configuration file specified.}`);

        return;
    }

    console.log(chalk`Loading conversation configuration from "{blueBright ${configFile}}"...`);

    try {
        intentResolver = await loadIntentResolverFromConfiguration(configFile);
    } catch (error) {
        console.error(chalk`{redBright ERROR: Could not load conversation processor from specified configuration file.}`, error);

        return;
    }

    currentConfigFile = configFile;
}
