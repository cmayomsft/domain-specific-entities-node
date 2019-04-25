import { default as debug } from "debug";
import { Entity, IIntentEnricher } from "intentalyzer";
import { Recognizer, WORD } from "token-flow";
import { EntityToken, TokenFlowEntity } from "./types";
import { composeRecognizerArray, isStringArray, loadTokenFileIntoPatternRecognizer } from "./utilities";

const debugLogger = debug("intentalyzer:integration:token-flow:enrichers:full-utterance-enricher");

export function createTokenFlowFullUtteranceEnricher<TConversationContext, TEntity extends Entity>(
    ...recognizers: string[] | Recognizer[]): IIntentEnricher<TConversationContext, TEntity, TEntity|TokenFlowEntity> {
    if (recognizers.length === 0) {
        throw new Error("Expected at least one recognizer file/instance to be specified.");
    }

    debugLogger("Creating a new token-flow full utterance enricher...");

    if (isStringArray(recognizers)) {
        debugLogger("Loading recognizers from specified files...");

        recognizers = recognizers.map(loadTokenFileIntoPatternRecognizer);
    }

    const tokenFlowRecognizer = composeRecognizerArray(recognizers);

    return {
        enrich: async (cc, ri) => {
            debugLogger("Processing recognized intent...");

            const wordTokens = ri.utterance.split(/\s+/).map((w) => ({ type: WORD, text: w }));

            debugLogger("Generated %i WORD tokens from utterance: %O", wordTokens.length, wordTokens);

            debugLogger("Applying the token-flow recognizer to the WORD tokens...");

            const entityTokens = tokenFlowRecognizer.apply(wordTokens);

            // If TokenFlow didn't recognize any entities, then just return the original RecognizedUtterance
            if (entityTokens.length === 0) {
                debugLogger("No ENTITY tokens recognized; returning original recognized intent.");

                return ri;
            }

            debugLogger("Mapping %i ENTITY tokens to new entities: %o", entityTokens.length, entityTokens);

            // Translate the TokenFlow entities into BasicEntity derivitives for this abstraction
            const mappedEntityTokens = entityTokens.map((t): TokenFlowEntity => {
                const et = t as EntityToken; // NOTE: we know only EntityToken subtypes will come out
                return {
                    type: "token-flow",
                    $raw: et,
                    name: et.name,
                    pid: et.pid,
                };
            });

            debugLogger("Adding %i new TokenFlowEntity entities to the recognized intent: %o", mappedEntityTokens.length, mappedEntityTokens);

            return {
                utterance: ri.utterance,
                intent: ri.intent,
                entities: [...ri.entities, ...mappedEntityTokens],
            };
        },
    };
}
