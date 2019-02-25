import { Entity, IIntentEnricher } from "conversation-processor";
import { CompositeRecognizer, Recognizer, WORD } from "token-flow";
import { EntityToken, TokenFlowEntity } from "./types";
import { isStringArray, loadTokenFileIntoPatternRecognizer } from "./utilities";

export function createTokenFlowFullUtteranceEnricher<TConversationContext, TEntity extends Entity>(
    ...recognizers: string[] | Recognizer[]): IIntentEnricher<TConversationContext, TEntity, TEntity|TokenFlowEntity> {
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

            // If TokenFlow didn't recognize any entities, then just return the original RecognizedUtterance
            if (entityTokens.length === 0) {
                return ru;
            }

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

            return {
                utterance: ru.utterance,
                intent: ru.intent,
                entities: [...ru.entities, ...mappedEntityTokens],
            };
        },
    };
}
