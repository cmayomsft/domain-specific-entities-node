import chalk from "chalk";
import { Entity, IIntentResolver, RecognizedIntent } from "intentalyzer";
import * as moment from "moment";
import { default as createThrottle } from "p-throttle";
import { loadInputs, writeOutputs } from "../file-utilities";
import { loadIntentResolverFromConfiguration } from "../intent-resolver-configuration";

interface ProcessedRunUtteranceOutput {
    inputUtterance: string;
    recognized: RecognizedIntent<Entity>|null;
}

// tslint:disable:no-console

export async function executeRunCommand(configFile: string, inputsFilePath: string, outputsFilePath: string|undefined, options: { maxUtterancesPerSecond: number }) {
    console.log(`Loading configuration file "${chalk.blueBright(configFile)}"...`);

    let conversationProcessor: IIntentResolver<any, any>;

    try {
        conversationProcessor = await loadIntentResolverFromConfiguration(configFile);
    } catch (error) {
        console.error(chalk.red("ERROR: Could not load conversation processor from specified configuration file."), error);

        return;
    }

    console.log(`Loading inputs from "${chalk.blueBright(inputsFilePath)}"...`);

    const inputs = await loadInputs(inputsFilePath);
    const results = new Array<ProcessedRunUtteranceOutput>();
    const utteranceProcessingThrottler = createThrottle(
        async (utterance: string) => {
            console.log(`${chalk.gray(">")} ${utterance}`);

            return await conversationProcessor.processUtterance(null, utterance);
        },
        options.maxUtterancesPerSecond,
        1000);

    console.log(`Beginning processing of utterances...`);
    const runStart = moment();

    let runNumber = 0;

    for await (const { utterance } of inputs) {
        runNumber++;

        const recognizedIntent = await utteranceProcessingThrottler(utterance);

        results.push({
            inputUtterance: utterance,
            recognized: recognizedIntent,
        });
    }

    console.log(`Run completed! ${runNumber} utterance(s) proccessed in ${moment.duration(moment().diff(runStart))}.`);

    if (outputsFilePath) {
        console.log(`Writing result(s)...`);

        outputsFilePath = await writeOutputs(results, outputsFilePath);

        console.log(`${runNumber} result(s) written to "${chalk.blueBright(outputsFilePath)}".`);
    }
}
