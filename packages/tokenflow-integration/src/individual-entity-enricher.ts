import * as flatMap from "array.prototype.flatmap";
import { Entity, IIntentEnricher } from "conversation-processor";
import { CompositeRecognizer, Recognizer, WORD } from "token-flow";
import { EntityToken, isEntityToken, TokenFlowEnrichedEntity } from "./types";
import { isStringArray, loadTokenFileIntoPatternRecognizer } from "./utilities";

flatMap.shim();

export type EntityWordSelector<TEntity extends Entity> = (entity: TEntity) => string|string[]|undefined;

// TODO: finish this utility method
// export function splitEntityWords<TEntity extends Entity>(entityValueSelector: (entity: TEntity) => string): EntityWordSelector<TEntity> {
//     return (entity: TEntity) => entityValueSelector(entity).split(' ');
// }

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
            // Map the existing entities, applying the entity word selector, into WORD tokens
            const entityWordTokens = ri.entities
                .map((e) => ({ Entity: e, SelectedWords: entityWordSelector(e as TEntity) }))
                .flatMap((it) => {
                    const selectedWords = it.SelectedWords;

                    if (selectedWords === undefined) {
                        return [];
                    }

                    if (typeof selectedWords === "string") {
                        return [ { type: WORD, text: it.SelectedWords, $dse_sourceEntity: it.Entity } ];
                    }

                    return selectedWords.map((sw) => ({ type: WORD, text: sw, $dse_sourceEntity: it.Entity }));
                });

            // Run the selected word tokens through TokenFlow
            const tokens = tokenFlowRecognizer.apply(entityWordTokens);

            const entityTokensByEntity = new Map<object, EntityToken>();

            // Create a map of all ENTITY tokens to their source entities
            tokens
                .filter(isEntityToken)
                .forEach((et) => {
                    entityTokensByEntity.set((et.children[0] as any).$dse_sourceEntity, et);

                    et.children.forEach((c) => delete (c as any).$dse_sourceEntity);
                });

            const finalMappedEntities = ri.entities.map((e) => {
                const entityToken = entityTokensByEntity.get(e);

                // If an ENTITY token was found for this entity, return the entity intersected with the TokenFlow details
                if (entityToken) {
                    return {
                        ...e,
                        entityToken,
                    };
                }

                // No matching ENTITY token for this entity, just return the original entity
                return e;
            });

            return {
                utterance: ri.utterance,
                intent: ri.intent,
                entities: finalMappedEntities,
            };
        },
    };
}
