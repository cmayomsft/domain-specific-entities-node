import { default as debug } from "debug";
import { IIntentRecognizer } from "./core-types";
import { BasicEntity, Entity } from "./entities";

const chainDebugLogger = debug("intentalyzer:recognizers:chain");

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
    recognizers: Array<IIntentRecognizer<TConversationContext, TEntity>>,
): IIntentRecognizer<TConversationContext, TEntity>;

/**
 * Creates a chain of recognizers which will be executed in the order supplied. Execution of the
 * chain stops at the first recognizer that returns a non-null result.
 */
export function createRecognizerChain<TConversationContext, TEntity extends Entity = BasicEntity>(
    recognizers: any,
): IIntentRecognizer<TConversationContext, TEntity> {
    const normalizedRecognizerParams = Array.isArray(recognizers) ? recognizers : arguments;

    chainDebugLogger("Creating a recognizer chain out of %i recognizers...", normalizedRecognizerParams.length);

    return {
        recognize: async (c, u) => {
            chainDebugLogger("Recognizer chain running for utterance: %s", u);

            let result = null;

            for (const r of normalizedRecognizerParams) {
                result = await r.recognize(c, u);

                if (result !== null) {
                    chainDebugLogger("Intent recognized: %o", result);

                    break;
                }
            }

            if (result === null) {
                chainDebugLogger("No intent recognized!");
            }

            return result;
        },
    };
}
