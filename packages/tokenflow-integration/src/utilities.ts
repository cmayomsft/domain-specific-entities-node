import * as fs from "fs";
import { itemMapFromYamlString, PatternRecognizer, PID, Token, Tokenizer } from "token-flow";
import { ENTITY, EntityToken } from "./types";

export function loadTokenFileIntoPatternRecognizer(fileName: string) {
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
