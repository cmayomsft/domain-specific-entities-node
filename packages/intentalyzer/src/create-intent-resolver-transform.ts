import { Entity, IIntentResolver, IIntentTransform } from ".";
import { RecognizedIntent } from "./core-types";

export type RecognizedIntentAggregator = <TEntity extends Entity, TTransformedEntity extends Entity>(originalRecognizedIntent: RecognizedIntent<TEntity>, newlyRecognizedIntent: RecognizedIntent<TTransformedEntity>) => RecognizedIntent<TTransformedEntity>;

export function createIntentResolverTransform<TConversationContext, TEntity extends Entity, TTransformedEntity extends Entity>(intentResolver: IIntentResolver<TConversationContext, TTransformedEntity>, intentAggregator?: RecognizedIntentAggregator): IIntentTransform<TConversationContext, TEntity, TEntity | TTransformedEntity> {
    return {
        apply: async (c, ri) => {
            const newlyRecognizedIntent = await intentResolver.processUtterance(c, ri.utterance);

            // If the resolver didn't produce a new recognized intent, just return the original
            if (newlyRecognizedIntent === null) {
                return ri;
            }

            // If no aggregator was supplied, just return the newly recognized intent
            if (intentAggregator === undefined) {
                return newlyRecognizedIntent;
            }

            return intentAggregator(ri, newlyRecognizedIntent);
        },
    };
}
