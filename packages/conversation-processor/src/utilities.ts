import { IIntentEnricher } from "./index";

/** Utility function that takes a set of intent enrichers and will execute them all concurrently. */
export function enrichConcurrently<TConversationContext>(...enrichers: Array<IIntentEnricher<TConversationContext>>): IIntentEnricher<TConversationContext> {
    return {
        enrich: async (c, u) => {
            await Promise.all(enrichers.map((ie) => ie.enrich(c, u)));
        },
    };
}
