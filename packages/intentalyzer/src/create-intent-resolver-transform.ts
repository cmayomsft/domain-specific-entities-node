import { Entity, IIntentResolver, IIntentTransform } from ".";

export function createIntentResolverTransform<TConversationContext, TEntity extends Entity, TTransformedEntity extends Entity>(intentResolver: IIntentResolver<TConversationContext, TTransformedEntity>): IIntentTransform<TConversationContext, TEntity, TEntity | TTransformedEntity> {
    return {
        apply: async (c, ri) => {
            const newlyRecognizedIntent = await intentResolver.processUtterance(c, ri.utterance);

            // If the resolver didn't produce a new recognized intent, just return the original
            if (newlyRecognizedIntent === null) {
                return ri;
            }

            return newlyRecognizedIntent;
        },
    };
}
