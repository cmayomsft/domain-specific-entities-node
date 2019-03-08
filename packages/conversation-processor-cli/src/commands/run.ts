import { Entity, IIntentResolver, RecognizedIntent } from "conversation-processor";
import { default as createThrottle } from "p-throttle";
import { loadInputs, writeOutputs } from "../file-utilities";
import { loadIntentResolverFromConfiguration } from "../intent-resolver-configuration";

interface ProcessedRunUtteranceOutput {
    inputUtterance: string;
    recognized: RecognizedIntent<Entity>|null;
}

// tslint:disable:no-console

export async function executeRunCommand(configFile: string, inputsFilePath: string, outputsFilePath: string|undefined, options: { maxUtterancesPerSecond: number }) {
    console.log(`Loading configuration file "${configFile}" for run...`);

    let conversationProcessor: IIntentResolver<any, any>;

    try {
        conversationProcessor = await loadIntentResolverFromConfiguration(configFile);
    } catch (error) {
        console.error("ERROR: Could not load conversation processor from specified configuration file.", error);

        return;
    }

    console.log(`Loading inputs from "${inputsFilePath}"...`);

    const inputs = await loadInputs(inputsFilePath);
    const results = new Array<ProcessedRunUtteranceOutput>();
    const utteranceProcessingThrottler = createThrottle(
        async (utterance: string) => await conversationProcessor.processUtterance(null, utterance),
        options.maxUtterancesPerSecond,
        1000);

    console.log(`Beginning processing of utterances...`);

    let runNumber = 0;

    for await (const { utterance } of inputs) {
        runNumber++;

        if (runNumber % 10 === 0) {
            console.log(`Processing utterance ${runNumber}...`);
        }

        const recognizedIntent = await utteranceProcessingThrottler(utterance);

        results.push({
            inputUtterance: utterance,
            recognized: recognizedIntent,
        });
    }

    console.log(`Run completed! ${runNumber} utterance(s) proccessed.`);

    if (outputsFilePath) {
        console.log(`Writing ${results.length} result(s)...`);

        outputsFilePath = await writeOutputs(results, outputsFilePath);

        console.log(`${runNumber} result(s) written to "${outputsFilePath}".`);
    }
}
