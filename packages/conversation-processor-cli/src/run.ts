import { BasicEntity, IConversationProcessor, RecognizedUtterance } from "conversation-processor";
import { diff, Diff } from "deep-diff";
import * as fs from "fs";
import * as moment from "moment";
import * as path from "path";
import { loadConverationProcessorFromConfiguration } from "./conversation-processor-configuration";

interface ProcessedTestUtteranceOutputs {
    inputUtterance: string;
    executionDuration: number;
    recognized: RecognizedUtterance<BasicEntity>|null;
    recognizedDiff: Array<Diff<any, RecognizedUtterance<any>|null>>|undefined;
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

export async function runBatchProcessing(configFile: string, inputsFilePath: string, outputsFilePath: string|undefined, outputDiff: boolean) {
    console.log(`Loading configuration file "${configFile}" for run...`);

    let conversationProcessor: IConversationProcessor<any, any>;

    try {
        conversationProcessor = await loadConverationProcessorFromConfiguration(configFile);
    } catch (error) {
        console.error("ERROR: Could not load conversation processor from specified configuration file.", error);

        return;
    }

    console.log(`Loading inputs from "${inputsFilePath}"...`);

    const testInputs = await loadTestInputs(inputsFilePath);
    const results = new Array<ProcessedTestUtteranceOutputs>();

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

        const executionStart = moment();
        const recognizedUtterance = await conversationProcessor.processUtterance(null, utterance);
        const executionEnd = moment();

        let expectedVersusActualResolutionDiff;

        // Only perform the diff if the option was specified
        if (outputDiff) {
            expectedVersusActualResolutionDiff = diff(expectedRecognition, recognizedUtterance);
        }

        results.push({
            inputUtterance: utterance,
            executionDuration: executionEnd.diff(executionStart),
            recognized: recognizedUtterance,
            recognizedDiff: expectedVersusActualResolutionDiff,
        });
    }

    runInfo.timings.endDate = moment().utc().toDate();
    runInfo.timings.duration = moment(runInfo.timings.endDate!).diff(runInfo.timings.startDate);
    runInfo.outputs = results;

    console.log(`Run completed! ${runNumber} utterance(s) proccessed.`);

    if (outputsFilePath) {
        console.log(`Writing ${results.length} result(s)...`);

        outputsFilePath = await writeRunInfo(runInfo, outputsFilePath);

        console.log(`${runNumber} result(s) written to "${outputsFilePath}".`);
    }
}

// tslint:enable:no-console

// TODO: make this use async streaming JSON parsing APIs for great perf with large files
async function* loadTestInputs(inputsFilePath: string) {
    const loadedInputs = await new Promise<any>((resolve, reject) => {
        fs.readFile(
            inputsFilePath,
            (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(data.toString()));
                }
            });
        });

    if (!Array.isArray(loadedInputs)) {
        throw new Error("Expected the root element of the inputs to be an array of JSON objects.");
    }

    for (const input of loadedInputs) {
        const expectedRecognition = input.recognized;
        let utterance = input.utterance as string;

        if (!utterance) {
            utterance = expectedRecognition.utterance;
        }

        yield { utterance, expectedRecognition };
    }
}

async function writeRunInfo(runInfo: RunInfo, outputsFilePath: string) {
    // Make sure the output file's directory actually exists first (writeFile will not create the dir)
    ensureOutputFileDirectoryExists();
    normalizeOutputsFileName();

    return new Promise<string>((resolve, reject) => {
        fs.writeFile(
            outputsFilePath,
            JSON.stringify(runInfo, null, 4),
            {
                flag: "w", // open for [re-]writing, create if doesn't exist
            },
            (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(outputsFilePath);
                }
            });
        });

    function ensureOutputFileDirectoryExists() {
        const outputsFileDirectory = path.dirname(outputsFilePath);

        try {
            fs.mkdirSync(outputsFileDirectory);
        } catch (error) {
            if (error.code !== "EEXIST") {
                throw error;
            }
        }
    }

    function normalizeOutputsFileName() {
        const outputsFileDirectory = path.dirname(outputsFilePath);
        let outputsFileName = path.basename(outputsFilePath);

        if (outputsFileName.lastIndexOf("<timestamp>") !== -1) {
            outputsFileName = outputsFileName.replace("<timestamp>", moment().utc().format("YYYY-MM-DD.HH-mm-ss"));
        } else {
            const versionOffset = outputsFileName.lastIndexOf("<version>");

            if (versionOffset !== -1) {
                const baseOutputsFileName = outputsFileName.substring(0, versionOffset);
                const currentFileCount = fs.readdirSync(outputsFileDirectory, { withFileTypes: true }).filter((f) => f.name.startsWith(baseOutputsFileName)).length;

                outputsFileName = outputsFileName.replace("<version>", (currentFileCount + 1).toString());
            }
        }

        outputsFilePath = path.join(outputsFileDirectory, outputsFileName);
    }
}
