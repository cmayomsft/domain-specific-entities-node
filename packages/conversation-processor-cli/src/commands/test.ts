import { Entity, IIntentResolver, RecognizedIntent } from "conversation-processor";
import { diff, Diff } from "deep-diff";
import * as moment from "moment";
import { default as createThrottle } from "p-throttle";
import { loadInputs, writeOutputs } from "../file-utilities";
import { loadIntentResolverFromConfiguration } from "../intent-resolver-configuration";

interface ProcessedTestUtteranceOutputs {
    inputUtterance: string;
    executionDuration: number;
    recognized: RecognizedIntent<Entity>|null;
    recognizedDiff: Array<Diff<any, RecognizedIntent<any>|null>>|undefined;
}

interface RunTimings {
    startDate: Date;
    endDate?: Date;
    duration?: number;
}

interface RunInfo {
    inputsFilePath: string;
    timings: RunTimings;
    outputs?: ProcessedTestUtteranceOutputs[];
}

// tslint:disable:no-console

export async function executeTestCommand(configFile: string, inputsFilePath: string, outputsFilePath: string|undefined, options: { outputDiff: boolean, maxUtterancesPerSecond: number }) {
    console.log(`Loading configuration file "${configFile}" for run...`);

    let conversationProcessor: IIntentResolver<any, any>;

    try {
        conversationProcessor = await loadIntentResolverFromConfiguration(configFile);
    } catch (error) {
        console.error("ERROR: Could not load conversation processor from specified configuration file.", error);

        return;
    }

    console.log(`Loading inputs from "${inputsFilePath}"...`);

    const testInputs = await loadInputs(inputsFilePath);
    const results = new Array<ProcessedTestUtteranceOutputs>();
    const utteranceProcessingThrottler = createThrottle(
        async (utterance: string) => {
            const executionStart = moment();
            const recognizedIntent = await conversationProcessor.processUtterance(null, utterance);
            const executionEnd = moment();

            return {
                executionStart,
                executionEnd,
                recognizedIntent,
            };
        },
        options.maxUtterancesPerSecond,
        1000);

    console.log(`Beginning processing of test utterances...`);

    const runInfo: RunInfo = {
        inputsFilePath,
        timings: { startDate: moment().utc().toDate() },
    };

    let runNumber = 0;

    for await (const { utterance, expectedRecognition } of testInputs) {
        runNumber++;

        if (runNumber % 10 === 0) {
            console.log(`Processing utterance ${runNumber}...`);
        }

        const utteranceProcessingResult = await utteranceProcessingThrottler(utterance)

        let expectedVersusActualResolutionDiff;

        // Only perform the diff if the option was specified
        if (options.outputDiff) {
            expectedVersusActualResolutionDiff = diff(expectedRecognition, utteranceProcessingResult.recognizedIntent);
        }

        results.push({
            inputUtterance: utterance,
            executionDuration: utteranceProcessingResult.executionEnd.diff(utteranceProcessingResult.executionStart),
            recognized: utteranceProcessingResult.recognizedIntent,
            recognizedDiff: expectedVersusActualResolutionDiff,
        });
    }

    runInfo.timings.endDate = moment().utc().toDate();
    runInfo.timings.duration = moment(runInfo.timings.endDate!).diff(runInfo.timings.startDate);
    runInfo.outputs = results;

    console.log(`Run completed! ${runNumber} utterance(s) proccessed.`);

    if (outputsFilePath) {
        console.log(`Writing ${results.length} result(s)...`);

        outputsFilePath = await writeOutputs(runInfo, outputsFilePath);

        console.log(`${runNumber} result(s) written to "${outputsFilePath}".`);
    }
}
