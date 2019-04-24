import { default as debug } from "debug";
import { IIntentEnricher } from "./core-types";
import { Entity } from "./entities";

const utilityDebugLogger = debug("intentalyzer:utilities");

/**
 * Utility function that wraps a given intent enricher and will only execute it if the incoming intent matches a specific intent value/set of values.
 */
export function enrichSpecificIntent<TConversationContext, TEntity extends Entity, TEnrichedEntity extends Entity>(
    intents: string|string[],
    enricher: IIntentEnricher<TConversationContext, TEntity, TEnrichedEntity>): IIntentEnricher<TConversationContext, TEntity, TEntity|TEnrichedEntity> {

    let intentTester: (intent: string) => boolean;
    let intentTesterStrategy: string;

    // Choose the optimal implementation based on whether it's a single string value or an array of values
    if (typeof intents === "string") {
        intentTesterStrategy = "Single";
        intentTester = (intent) => intent === intents;
    } else {
        intentTesterStrategy = `Multilple [${intents.length}]`;
        intentTester = new Set(intents).has;
    }

    utilityDebugLogger("Creating a specific intent enricher: %s", intentTesterStrategy);

    return {
        enrich: async (c, ri) => {
            // If it's not one of the matching intents, just return the original recognized intent
            if (!intentTester(ri.intent)) {
                utilityDebugLogger("\"%s\" was not a matching intent, just returning original recognized intent.");

                return ri;
            }

            utilityDebugLogger("\"%s\" was a matching intent, enriching...");

            // Enrich and return the recognized intent
            return await enricher.enrich(c, ri);
        },
    };
}
