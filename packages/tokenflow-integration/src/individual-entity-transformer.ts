import * as flatMap from "array.prototype.flatmap";
import { default as debug } from "debug";
import { Entity, IIntentTransform } from "intentalyzer";
import { FuzzyItemDefinition, FuzzyTextMatcher } from "./fuzzy-text-matcher";
import { TokenFlowMatchedEntity } from "./types";

flatMap.shim();

const debugLogger = debug("intentalyzer:integration:token-flow:transformers:entity-transformer");

export type EntityWordSelector<TEntity extends Entity> = (entity: TEntity) => string|undefined;

export function createTokenFlowEntityTransform<TConversationContext, TEntity extends Entity, TFuzzyMatch>(
    entityWordSelector: EntityWordSelector<TEntity>,
    fuzzyItemDefinitions: IterableIterator<FuzzyItemDefinition<TFuzzyMatch>>): IIntentTransform<TConversationContext, TEntity, TEntity|TEntity & TokenFlowMatchedEntity<TFuzzyMatch>> {

    debugLogger("Creating a new token-flow entity transform...");

    const entityFuzzyTextMatcher = new FuzzyTextMatcher(fuzzyItemDefinitions, /* debugMode */ false);

    return {
        apply: async (_, ri) => {
            const entities = ri.entities;

            debugLogger("Processing RecognizedIntent with %i entities...", entities.length);

            const finalMappedEntities = entities
                .map((entity) => ({ entity, selectedWords: entityWordSelector(entity as TEntity) }))
                .map((it) => {
                    const selectedWords = it.selectedWords;
                    const entity = it.entity;

                    if (selectedWords === undefined) {
                        debugLogger("Entity with name '%s' produced no words.", entity.name);

                        return {
                            entity,
                            matches: undefined,
                        };
                    }

                    debugLogger("Entity with name '%s' produced words '%s' which will now be fuzzy matched...", entity.name, selectedWords);

                    const entityWithMatches = {
                        entity,
                        matches: entityFuzzyTextMatcher.matches(selectedWords),
                    };

                    const topMatch = entityWithMatches.matches[0];

                    debugLogger("Entity with name '%s' and words '%s' resulted in %n matches. Top match with score of %n was: %o", entity.name, selectedWords, entityWithMatches.matches.length, topMatch.score, topMatch.match);

                    return entityWithMatches;
                })
                .map((entityWithMatches) => {
                  const originalEntity = entityWithMatches.entity;

                  if (!entityWithMatches.matches) {
                    return originalEntity;
                  }

                  return {
                    ...originalEntity,
                    matches: entityWithMatches.matches,
                  } as TEntity & TokenFlowMatchedEntity<TFuzzyMatch>;
                });

            return {
                utterance: ri.utterance,
                intent: ri.intent,
                entities: finalMappedEntities,
            };
        },
    };
}
