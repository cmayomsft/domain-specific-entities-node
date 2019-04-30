import { default as debug } from "debug";
import * as fs from "fs";
import { CompositeRecognizer, itemMapFromYamlString, PatternRecognizer, PID, Recognizer, Token, Tokenizer } from "token-flow";
import { ENTITY, EntityToken } from "./types";

const utilitiesDebugLogger = debug("intentalyzer:integration:token-flow:utilities");

export function loadTokenFileIntoPatternRecognizer(fileName: string) {
    utilitiesDebugLogger("Loading item map from file '%s' into PatternRecognizer...", fileName);

    const itemMap = itemMapFromYamlString(fs.readFileSync(fileName, "utf8"));

    return new PatternRecognizer(itemMap, (pid: PID, children: Token[]): EntityToken => {
        const item = itemMap.get(pid);
        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        return { type: ENTITY, pid, name, children };
    }, new Set<string>(), Tokenizer.defaultStemTerm,
    /* addTokensToDownStream: */ false,
    /* relaxedMatching: */ true,
    /* debugMode: */ false);
}

/** Helper type guard to detect a string array.  */
export function isStringArray(array: string[]|any[]): array is string[] {
    return typeof array[0] === "string";
}

export function composeRecognizerArray(recognizers: Recognizer[]) {
    if (recognizers.length === 1) {
        return recognizers[0];
    }

    utilitiesDebugLogger("Creating CompositeRecognizer around %i recognizers...", recognizers.length);

    return new CompositeRecognizer(
        recognizers,
        /* debugMode: */ false);
}
