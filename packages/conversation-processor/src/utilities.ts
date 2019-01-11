import { Entity, IIntentEnricher } from "./index";

/** Utility function that takes a set of intent enrichers and will execute them all concurrently. */
export function enrichConcurrently<TConversationContext, TEntity extends Entity>(...enrichers: Array<IIntentEnricher<TConversationContext, TEntity>>): IIntentEnricher<TConversationContext, TEntity> {
    return {
        enrich: async (c, u) => {
            await Promise.all(enrichers.map((ie) => ie.enrich(c, u)));
        },
    };
}
