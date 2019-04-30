import { default as debug } from "debug";
import { IIntentEnricher } from "./core-types";
import { BasicEntity, Entity } from "./entities";

const pipelineDebugLogger = debug("intentalyzer:enrichers:pipeline");

export function createEnricherPipeline<
    TConversationContext,
    TEntity extends Entity,
    TEnrichedEntity1 extends Entity,
    TEnrichedEntity2 extends Entity>(
    ...enrichers: [
        IIntentEnricher<TConversationContext, TEntity, TEnrichedEntity1>,
        IIntentEnricher<TConversationContext, TEnrichedEntity1, TEnrichedEntity2>,
    ])
    : IIntentEnricher<TConversationContext, TEntity, TEntity|TEnrichedEntity2>;

export function createEnricherPipeline<
    TConversationContext,
    TEntity extends Entity,
    TEnrichedEntity1 extends Entity,
    TEnrichedEntity2 extends Entity,
    TEnrichedEntity3 extends Entity>(
    ...enrichers: [
        IIntentEnricher<TConversationContext, TEntity, TEnrichedEntity1>,
        IIntentEnricher<TConversationContext, TEnrichedEntity1, TEnrichedEntity2>,
        IIntentEnricher<TConversationContext, TEnrichedEntity2, TEnrichedEntity3>,
    ]): IIntentEnricher<TConversationContext, TEntity, TEntity|TEnrichedEntity3>;

export function createEnricherPipeline<
    TConversationContext,
    TEntity extends Entity,
    TEnrichedEntity1 extends Entity,
    TEnrichedEntity2 extends Entity,
    TEnrichedEntity3 extends Entity,
    TEnrichedEntity4 extends Entity>(
    ...enrichers: [
        IIntentEnricher<TConversationContext, TEntity, TEnrichedEntity1>,
        IIntentEnricher<TConversationContext, TEnrichedEntity1, TEnrichedEntity2>,
        IIntentEnricher<TConversationContext, TEnrichedEntity2, TEnrichedEntity3>,
        IIntentEnricher<TConversationContext, TEnrichedEntity3, TEnrichedEntity4>,
    ]): IIntentEnricher<TConversationContext, TEntity, TEntity|TEnrichedEntity4>;

export function createEnricherPipeline<
    TConversationContext,
    TEntity extends Entity,
    TEnrichedEntity1 extends Entity,
    TEnrichedEntity2 extends Entity,
    TEnrichedEntity3 extends Entity,
    TEnrichedEntity4 extends Entity,
    TEnrichedEntity5 extends Entity>(
    ...enrichers: [
        IIntentEnricher<TConversationContext, TEntity, TEnrichedEntity1>,
        IIntentEnricher<TConversationContext, TEnrichedEntity1|TEntity, TEnrichedEntity2>,
        IIntentEnricher<TConversationContext, TEnrichedEntity2, TEnrichedEntity3>,
        IIntentEnricher<TConversationContext, TEnrichedEntity3, TEnrichedEntity4>,
        IIntentEnricher<TConversationContext, TEnrichedEntity4, TEnrichedEntity5>,
    ]): IIntentEnricher<TConversationContext, TEntity, TEntity|TEnrichedEntity4>;

export function createEnricherPipeline<TConversationContext, TEntity extends Entity = BasicEntity>(
    enrichers: Array<IIntentEnricher<TConversationContext, TEntity, TEntity>>,
): IIntentEnricher<TConversationContext, TEntity, TEntity>;

/** Creates a pipeline of enrichers which will be executed in the order supplied. */
export function createEnricherPipeline<TConversationContext, TEntity extends Entity = BasicEntity>(
    enrichers: any,
): IIntentEnricher<TConversationContext, TEntity, TEntity> {
    const normalizedEnricherParams = Array.isArray(enrichers) ? enrichers : arguments;

    pipelineDebugLogger("Creating enricher pipeline out of %i recognizers...", normalizedEnricherParams.length);

    return {
        enrich: async (c, ri) => {
            pipelineDebugLogger("Enrichment pipeline running on recognized intent: %o", ri);

            let result = ri;

            for (const e of normalizedEnricherParams) {
                result = await e.enrich(c, result);

                pipelineDebugLogger("Enriched: %o", result);
            }

            pipelineDebugLogger("Final enriched recognized intent: %o", result);

            return result;
        },
    };
}
