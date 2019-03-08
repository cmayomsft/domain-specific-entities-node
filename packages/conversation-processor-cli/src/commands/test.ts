import { Entity, IIntentResolver, RecognizedIntent } from "conversation-processor";
import { diff, Diff } from "deep-diff";
import * as moment from "moment";
import { default as createThrottle } from "p-throttle";
import { loadInputs, writeOutputs } from "../file-utilities";
import { createIntentResolverFromConfiguration, loadIntentResolverConfiguration } from "../intent-resolver-configuration";

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
    testCounts: { executed: number, failed: number };
}

// tslint:disable:no-console

export async function executeTestCommand(configFile: string, inputsFilePath: string, outputsFilePath: string|undefined, options: { outputDiff: boolean, maxUtterancesPerSecond: number }) {
    console.log(`Loading configuration file "${configFile}" for run...`);

    const config = await loadIntentResolverConfiguration(configFile);
    let conversationProcessor: IIntentResolver<any, any>;

    try {
        conversationProcessor = await createIntentResolverFromConfiguration(config);
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
        testCounts: { executed: 0, failed: 0 },
    };

    for await (const { utterance, expectedRecognition } of testInputs) {
        if (runInfo.testCounts.executed % 10 === 0) {
            console.log(`Processing utterance ${runInfo.testCounts.executed}...`);
        }

        const utteranceProcessingResult = await utteranceProcessingThrottler(utterance);

        runInfo.testCounts.executed++;

        let expectedVersusActualResolutionDiff;

        // Only perform the diff if the option was specified
        if (options.outputDiff) {
            expectedVersusActualResolutionDiff = diff(expectedRecognition, utteranceProcessingResult.recognizedIntent, config.diffFilter);
        }

        if (expectedVersusActualResolutionDiff) {
            runInfo.testCounts.failed++;

            const diffTypes = calculateDiffTypeCounts(expectedVersusActualResolutionDiff);
            console.error(`❌ [ ${buildDiffTypeDisplayString(diffTypes)} ] - ${utterance}`);
        } else {
            console.info(`✔ - ${utterance}`);
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

    console.log("");
    console.log("Run completed!");
    console.log(`${runInfo.testCounts.executed} utterance(s) proccessed.`);

    if (runInfo.testCounts.failed > 0) {
        console.warn(`${runInfo.testCounts.failed} failure(s); success rate = ${(100 - ((runInfo.testCounts.failed / runInfo.testCounts.executed) * 100)).toPrecision(2)}%.`);
    } else {
        console.log("No failures.");
    }

    if (outputsFilePath) {
        console.log("");
        console.log(`Writing ${results.length} result(s)...`);

        outputsFilePath = await writeOutputs(runInfo, outputsFilePath);

        console.log(`${runInfo.testCounts.executed} result(s) written to "${outputsFilePath}".`);
    }

    function calculateDiffTypeCounts(diffs: Array<Diff<any, RecognizedIntent<any> | null>>) {
        const diffTypeCounts = new Map<string, number>();

        diffs.forEach((d) => {
            let countForDiffType = diffTypeCounts.get(d.kind);

            if (!countForDiffType) {
                countForDiffType = 0;
            }

            countForDiffType++;

            diffTypeCounts.set(d.kind, countForDiffType);
        });

        return diffTypeCounts;
    }

    function buildDiffTypeDisplayString(diffCounts: Map<string, number>) {
        let display = "";

        diffCounts.forEach((count, type) => {
            display += `${type}=${count};`;
        });

        return display;
    }
}
