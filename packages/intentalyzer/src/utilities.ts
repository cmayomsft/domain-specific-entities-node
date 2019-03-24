import { IIntentEnricher, IIntentRecognizer } from "./core-types";
import { BasicEntity, Entity } from "./entities";

export function createRecognizerChain<
    TConversationContext,
    TEntity1 extends Entity,
    TEntity2 extends Entity>(
    ...recognizers: [
        IIntentRecognizer<TConversationContext, TEntity1>,
        IIntentRecognizer<TConversationContext, TEntity2>
    ])
    : IIntentRecognizer<TConversationContext, TEntity1|TEntity2>;

export function createRecognizerChain<
    TConversationContext,
    TEntity1 extends Entity,
    TEntity2 extends Entity,
    TEntity3 extends Entity>(
    ...recognizers: [
        IIntentRecognizer<TConversationContext, TEntity1>,
        IIntentRecognizer<TConversationContext, TEntity2>,
        IIntentRecognizer<TConversationContext, TEntity3>
    ])
    : IIntentRecognizer<TConversationContext, TEntity1|TEntity2|TEntity3>;

export function createRecognizerChain<
    TConversationContext,
    TEntity1 extends Entity,
    TEntity2 extends Entity,
    TEntity3 extends Entity,
    TEntity4 extends Entity>(
    ...recognizers: [
        IIntentRecognizer<TConversationContext, TEntity1>,
        IIntentRecognizer<TConversationContext, TEntity2>,
        IIntentRecognizer<TConversationContext, TEntity3>,
        IIntentRecognizer<TConversationContext, TEntity4>
    ])
    : IIntentRecognizer<TConversationContext, TEntity1|TEntity2|TEntity3|TEntity4>;

export function createRecognizerChain<
    TConversationContext,
    TEntity1 extends Entity,
    TEntity2 extends Entity,
    TEntity3 extends Entity,
    TEntity4 extends Entity,
    TEntity5 extends Entity>(
    ...recognizers: [
        IIntentRecognizer<TConversationContext, TEntity1>,
        IIntentRecognizer<TConversationContext, TEntity2>,
        IIntentRecognizer<TConversationContext, TEntity3>,
        IIntentRecognizer<TConversationContext, TEntity4>,
        IIntentRecognizer<TConversationContext, TEntity5>
    ])
    : IIntentRecognizer<TConversationContext, TEntity1|TEntity2|TEntity3|TEntity4|TEntity5>;

export function createRecognizerChain<TConversationContext, TEntity extends Entity = BasicEntity>(
    recognizers: Array<IIntentRecognizer<TConversationContext, TEntity>>
): IIntentRecognizer<TConversationContext, TEntity>;

/** Creates a chain of recognizers which will be executed in the order supplied. Execution of the
 * chain stops at the first recognizer that returns a non-null result. */
export function createRecognizerChain<TConversationContext, TEntity extends Entity = BasicEntity>(
    recognizers: any,
): IIntentRecognizer<TConversationContext, TEntity> {
    const normalizedRecognizerParams = Array.isArray(recognizers) ? recognizers : arguments;

    return {
        recognize: async (c, u) => {
            let result = null;

            for (const r of normalizedRecognizerParams) {
                result = await r.recognize(c, u);

                if (result !== null) {
                    break;
                }
            }

            return result;
        },
    };
}

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
    enrichers: Array<IIntentEnricher<TConversationContext, TEntity, TEntity>>
): IIntentEnricher<TConversationContext, TEntity, TEntity>;

/** Creates a pipeline of enrichers which will be executed in the order supplied. */
export function createEnricherPipeline<TConversationContext, TEntity extends Entity = BasicEntity>(
    enrichers: any,
): IIntentEnricher<TConversationContext, TEntity, TEntity> {
    const normalizedEnricherParams = Array.isArray(enrichers) ? enrichers : arguments;

    return {
        enrich: async (c, ru) => {
            let result = ru;

            for (const e of normalizedEnricherParams) {
                result = await e.enrich(c, result);
            }

            return result;
        },
    };
}

/** Utility function that wraps a given intent enricher and will only execute it if the incoming intent matches a specific intent value/set of values. */
export function enrichSpecificIntent<TConversationContext, TEntity extends Entity, TEnrichedEntity extends Entity>(
    intents: string|string[],
    enricher: IIntentEnricher<TConversationContext, TEntity, TEnrichedEntity>): IIntentEnricher<TConversationContext, TEntity, TEntity|TEnrichedEntity> {
    return {
        enrich: async (c, ru) => {
            // If it's not one of the intents we're looking for, just return without executing any of the erichers
            if (typeof intents === "string") {
                if (ru.intent !== intents) {
                    return ru;
                }
            } else {
                // TODO: this is O(N) string compares every call; can/should we optimize to O(1) or will the set always be small enough to be insignificant
                if (intents.find((i) => i === ru.intent) === null) {
                    return ru;
                }
            }

            return await enricher.enrich(c, ru);
        },
    };
}
