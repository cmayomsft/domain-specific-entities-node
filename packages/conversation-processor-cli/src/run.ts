import { IConversationProcessor } from "conversation-processor";
import { diff } from "deep-diff";
import * as fs from "fs";
import * as path from "path";
import { loadConverationProcessorFromConfiguration } from "./conversation-processor-configuration";

interface ProcessedTestUtteranceOutputs {
    inputUtterance: string;
    resolutionDiff: any;
}

// tslint:disable:no-console

export async function runBatchProcessing(configFile: string, inputsFilePath: string, outputsFilePath: string) {
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

    let runNumber = 0;

    for await (const { utterance, expectedResolution } of testInputs) {
        runNumber++;

        if (runNumber % 10 === 0) {
            console.log(`Processing utterance ${runNumber}...`);
        }

        const resolvedUtterance = await conversationProcessor.processUtterance(null, utterance);

        const expectedVersusActualResolutionDiff = diff(expectedResolution, resolvedUtterance);

        results.push({ inputUtterance: utterance, resolutionDiff: expectedVersusActualResolutionDiff });
    }

    console.log(`Run completed! ${runNumber} utterance(s) proccessed.`);

    console.log(`Writing ${results.length} result(s) to "${outputsFilePath}"...`);

    await writeOutputs(outputsFilePath, results);
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
        const { utterance, expectedResolution } = input;

        yield { utterance, expectedResolution };
    }
}

async function writeOutputs(outputsFilePath: string, outputs: ProcessedTestUtteranceOutputs[]) {
    // Make sure the output file's directory actually exists first (writeFile will not create the dir)
    ensureOutputFileDirectoryExists();

    return new Promise((resolve, reject) => {
        fs.writeFile(
            outputsFilePath,
            JSON.stringify(outputs, null, 4),
            {
                flag: "w", // open for [re-]writing, create if doesn't exist
            },
            (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
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
}
