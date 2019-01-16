import { IIntentEnricher } from "./core-types";
import { BasicEntity } from "./entities";

/** Utility function that takes a set of intent enrichers and will only execute them if the incoming intent matches a specific intent value/set of values. */
export function enrichSpecificIntent<TConversationContext, TEntity extends BasicEntity>(intents: string|string[], ...enrichers: Array<IIntentEnricher<TConversationContext, TEntity>>): IIntentEnricher<TConversationContext, TEntity> {
    return {
        enrich: async (c, ru) => {
            // If it's not one of the intents we're looking for, just return without executing any of the erichers
            if (typeof intents === "string") {
                if (ru.intent !== intents) {
                    return;
                }
            } else {
                // TODO: this is O(N) string compares every call; can/should we optimize to O(1) or will the set always be small enough to be insignificant
                if (intents.find((i) => i === ru.intent) === null) {
                    return;
                }
            }

            // An intent matched, invoke all the enrichers
            for (const enricher of enrichers) {
                await enricher.enrich(c, ru);
            }
        },
    };
}

/** Utility function that takes a set of intent enrichers and will execute them all concurrently. */
export function enrichConcurrently<TConversationContext, TEntity extends BasicEntity>(...enrichers: Array<IIntentEnricher<TConversationContext, TEntity>>): IIntentEnricher<TConversationContext, TEntity> {
    return {
        enrich: async (c, ru) => {
            await Promise.all(enrichers.map((ie) => ie.enrich(c, ru)));
        },
    };
}
