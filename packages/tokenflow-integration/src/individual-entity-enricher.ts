import * as flatMap from "array.prototype.flatmap";
import { Entity, IIntentEnricher } from "conversation-processor";
import { CompositeRecognizer, Recognizer, WORD } from "token-flow";
import { isEntityToken, TokenFlowEnrichedEntity } from "./types";
import { isStringArray, loadTokenFileIntoPatternRecognizer } from "./utilities";

flatMap.shim();

export type EntityWordSelector<TEntity extends Entity> = (entity: TEntity) => string|string[]|undefined;

export function createTokenFlowEntityEnricher<TConversationContext, TEntity extends Entity>(
    entityWordSelector: EntityWordSelector<TEntity>,
    ...recognizers: string[] | Recognizer[]): IIntentEnricher<TConversationContext, TEntity, TEntity|TEntity & TokenFlowEnrichedEntity> {
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
        enrich: async (_, ri) => {
            // Map out the existing entities and apply the entity word selector
            const originalEntitiesWithSelectedWords = ri.entities
                .map((e) => ({ Entity: e, SelectedWords: entityWordSelector(e as TEntity) }));

            // Convert any/all selected words into WORD tokens for TokenFlow
            const selectedWordTokens = originalEntitiesWithSelectedWords
                .flatMap((ew) => ew.SelectedWords ? ew.SelectedWords : [])
                .map((w) => ({ type: WORD, text: w }));

            // If the selector didn't provide any words for processing, then we can just return the original RecognizedIntent
            if (selectedWordTokens.length === 0) {
                return ri;
            }

            // Run the selected word tokens through TokenFlow
            const tokens = tokenFlowRecognizer.apply(selectedWordTokens);

            // Map the original entities through, marrying up any ENTITY tokens from TokenFlow via type intersection
            let nextMappedTokenIndex = 0;
            const finalMappedEntities = originalEntitiesWithSelectedWords.map((oewsw, i) => {
                const originalEntity = originalEntitiesWithSelectedWords[i].Entity;

                // If the entity selector originally produced words, then check for TokenFlow results
                if (oewsw.SelectedWords) {
                    const token = tokens[nextMappedTokenIndex++];

                    // If the TokenFlow entity produced an EntityToken then we want to intersect those details with the original entity
                    if (isEntityToken(token)) {
                        return {
                            ...originalEntity,
                            pid: token.pid,
                            $tokenFlowEntity: token,
                        };
                    }
                }

                // No matching EntityToken for this entity, just use the original entity
                return originalEntity;
            });

            return {
                utterance: ri.utterance,
                intent: ri.intent,
                entities: [...finalMappedEntities],
            };
        },
    };
}
