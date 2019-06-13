import * as flatMap from "array.prototype.flatmap";
import { default as debug } from "debug";
import { Entity, IIntentTransform, isCompositeEntity } from "intentalyzer";
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

    function* processEntities(entities: TEntity[]): IterableIterator<TEntity | TEntity & TokenFlowMatchedEntity<TFuzzyMatch>> {
        for (const entity of entities) {
            // If it's a composite, recurse into it
            if (isCompositeEntity<TEntity>(entity)) {
                yield {
                    ...entity,
                    children: Array.from(processEntities(entity.children)),
                };

                continue;
            }

            const selectedWords = entityWordSelector(entity as TEntity);

            if (selectedWords === undefined) {
                debugLogger("Entity with name '%s' produced no words, just returning original entity.", entity.name);

                yield entity;

                continue;
            }

            debugLogger("Entity with name '%s' produced words '%s' which will now be fuzzy matched...", entity.name, selectedWords);

            const matches = entityFuzzyTextMatcher.matches(selectedWords);

            if (matches.length === 0) {
                debugLogger("No matches were found for entity with name '%s' and words '%s', just returning original entity.", entity.name, selectedWords);

                yield entity;

                continue;
            }

            debugLogger("Entity with name '%s' and words '%s' resulted in %n matches.", entity.name, selectedWords, matches.length);

            const topMatch = matches[0];

            debugLogger("Top match with score of %n was: %o", topMatch.score, topMatch.match);

            yield {
                ...entity,
                matches,
            };
        }
    }

    return {
        apply: async (_, ri) => {
            const entities = ri.entities;

            debugLogger("Processing RecognizedIntent with %i entities...", entities.length);

            return {
                utterance: ri.utterance,
                intent: ri.intent,
                entities: Array.from(processEntities(entities)),
            };
        },
    };
}
