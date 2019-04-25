import * as flatMap from "array.prototype.flatmap";
import { default as debug } from "debug";
import { Entity, IIntentEnricher } from "intentalyzer";
import { Recognizer, WORD } from "token-flow";
import { EntityToken, isEntityToken, TokenFlowEnrichedEntity } from "./types";
import { composeRecognizerArray, isStringArray, loadTokenFileIntoPatternRecognizer } from "./utilities";

flatMap.shim();

const debugLogger = debug("intentalyzer:integration:token-flow:enrichers:entity-enricher");
const wordMappingDebugLogger = debug("intentalyzer:integration:token-flow:enrichers:entity-enricher:word-mapping");

export type EntityWordSelector<TEntity extends Entity> = (entity: TEntity) => string|string[]|undefined;

// TODO: finish this utility method
// export function splitEntityWords<TEntity extends Entity>(entityValueSelector: (entity: TEntity) => string): EntityWordSelector<TEntity> {
//     return (entity: TEntity) => entityValueSelector(entity).split(' ');
// }

export function createTokenFlowEntityEnricher<TConversationContext, TEntity extends Entity>(
    entityWordSelector: EntityWordSelector<TEntity>,
    ...recognizers: string[] | Recognizer[]): IIntentEnricher<TConversationContext, TEntity, TEntity|TEntity & TokenFlowEnrichedEntity> {

    debugLogger("Creating a new token-flow entity enricher...");

    if (recognizers.length === 0) {
        throw new Error("Expected at least one recognizer file/instance to be specified.");
    }

    if (isStringArray(recognizers)) {
        debugLogger("Loading recognizers from specified files...");

        recognizers = recognizers.map(loadTokenFileIntoPatternRecognizer);
    }

    const tokenFlowRecognizer = composeRecognizerArray(recognizers);

    return {
        enrich: async (_, ri) => {
            const entities = ri.entities;

            debugLogger("Processing RecognizedIntent with %i entities...", entities.length);

            // Map the existing entities, applying the entity word selector, into WORD tokens
            const entityWordTokens = entities
                .map((e) => ({ Entity: e, SelectedWords: entityWordSelector(e as TEntity) }))
                .flatMap((it) => {
                    const selectedWords = it.SelectedWords;
                    const entity = it.Entity;

                    if (selectedWords === undefined) {
                        wordMappingDebugLogger("Entity with name '%s' produced no words.", entity.name)

                        return [];
                    }

                    if (typeof selectedWords === "string") {
                        wordMappingDebugLogger("Entity with name '%s' produced a single word: %s", entity.name, selectedWords);

                        return [ { type: WORD, text: selectedWords, $dse_sourceEntity: entity } ];
                    }

                    wordMappingDebugLogger("Entity with name '%s' produced %i words: %o", entity.name, selectedWords.length, selectedWords);

                    return selectedWords.map((sw) => ({ type: WORD, text: sw, $dse_sourceEntity: entity }));
                });

            debugLogger("%i entities produced %i total WORD tokens: %O", entities.length, entityWordTokens.length, entityWordTokens);

            debugLogger("Applying the token-flow recognizer to the WORD tokens...");

            // Run the selected word tokens through TokenFlow
            const tokens = tokenFlowRecognizer.apply(entityWordTokens);

            const entityTokensByEntity = new Map<TEntity, EntityToken>();

            debugLogger("Mapping %i ENTITY tokens back to their original entities...", tokens.length);

            // Create a map of all ENTITY tokens to their source entities
            tokens
                .filter(isEntityToken)
                .forEach((et) => {
                    entityTokensByEntity.set((et.children[0] as any).$dse_sourceEntity, et);

                    // NOTE: here we remove the special property we threw on the WORD token for this mapping process so it doesn't appear later to downstream logic
                    et.children.forEach((c) => delete (c as any).$dse_sourceEntity);
                });

            debugLogger("Enriching the original entities with any corresponding ENTITY token from token-flow...")

            let numberOfEntitiesEnriched = 0;

            const finalMappedEntities = entities.map((e) => {
                const entityToken = entityTokensByEntity.get(e);

                // If an ENTITY token was found for this entity, return the entity intersected with the TokenFlow details
                if (entityToken) {
                    debugLogger("Enriching entity with name '%s' with ENTITY token: %O", e.name, entityToken);

                    numberOfEntitiesEnriched++;

                    return {
                        ...e,
                        entityToken,
                    };
                }

                debugLogger("Entity with name '%s' did not resolve to an ENTITY token and will not be enriched.", e.name);

                // No matching ENTITY token for this entity, just return the original entity
                return e;
            });

            debugLogger("%i total entities were enriched.", numberOfEntitiesEnriched);

            return {
                utterance: ri.utterance,
                intent: ri.intent,
                entities: finalMappedEntities,
            };
        },
    };
}
