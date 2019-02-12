import { BasicEntity, IIntentEnricher } from "conversation-processor";
import * as fs from "fs";
import { CompositeRecognizer, CompositeToken, itemMapFromYamlString, PatternRecognizer, PID, Recognizer, Token, Tokenizer, WORD } from "token-flow";

export const ENTITY: unique symbol = Symbol("ENTITY");

export type ENTITY = typeof ENTITY;

export interface TokenFlowEntity extends BasicEntity {
    type: "token-flow";
    $raw: any;
    name: string;
    pid: PID;
}

interface EntityToken extends CompositeToken {
    type: ENTITY;
    pid: PID;
    name: string;
}

export function createTokenFlowEnricher<TConversationContext, TEntity extends BasicEntity>(...recognizers: string[]|Recognizer[]): IIntentEnricher<TConversationContext, TEntity|TokenFlowEntity> {
    if (recognizers.length === 0) {
        throw new Error("Expected at least one recognizer file/instance to be specified.");
    }

    if (isStringArray(recognizers)) {
        recognizers = recognizers.map(loadTokenFileIntoPatternRecognizer);
    }

    const tokenFlowRecognizer: Recognizer = new CompositeRecognizer(
        recognizers,
        /* debugMode: */ false);

    return {
        enrich: async (cc, ru) => {
            const wordTokens = ru.utterance.split(/\s+/).map((w) => ({ type: WORD, text: w }));

            const entityTokens = tokenFlowRecognizer.apply(wordTokens);

            const normalizedEntityTokens = entityTokens.map((t): TokenFlowEntity => {
                const et = t as EntityToken; // NOTE: we know only EntityToken subtypes will come out

                return {
                    type: "token-flow",
                    $raw: et,
                    name: et.name,
                    pid: et.pid,
                };
            });

            ru.entities.push(...normalizedEntityTokens);
        },
    };
}

function loadTokenFileIntoPatternRecognizer(fileName: string) {
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
function isStringArray(array: string[]|any[]): array is string[] {
    return typeof array[0] === "string";
}
