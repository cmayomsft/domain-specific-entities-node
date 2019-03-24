import * as fs from "fs";
import { RecognizedIntent } from "intentalyzer";
import * as moment from "moment";
import * as path from "path";

// TODO: make this use async streaming JSON parsing APIs for great perf with large files
export async function* loadInputs(inputsFilePath: string) {
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
        const expectedRecognition = input.recognized as RecognizedIntent<any>;
        let utterance = input.utterance as string;

        if (!utterance) {
            utterance = expectedRecognition.utterance;
        }

        yield { utterance, expectedRecognition };
    }
}

export async function writeOutputs(outputs: any, outputsFilePath: string) {
    // Make sure the output file's directory actually exists first (writeFile will not create the dir)
    ensureOutputFileDirectoryExists();
    normalizeOutputsFileName();

    return new Promise<string>((resolve, reject) => {
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
