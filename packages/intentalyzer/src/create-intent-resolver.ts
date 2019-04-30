import { default as debug } from "debug";
import { IIntentEnricher, IIntentRecognizer, IIntentResolver } from "./core-types";
import { Entity, SimpleEntity } from "./entities";

const debugLogger = debug("intentalyzer:intent-resolver");

export function createIntentResolver<TEntity extends Entity = SimpleEntity>(
    recognizer: IIntentRecognizer<any, TEntity>,
    enricher?: IIntentEnricher<any, TEntity, TEntity>): IIntentResolver<any, TEntity>;

export function createIntentResolver<TConversationContext, TEntity extends Entity = SimpleEntity>(
        recognizer: IIntentRecognizer<TConversationContext, TEntity>,
        enricher?: IIntentEnricher<TConversationContext, TEntity, TEntity>): IIntentResolver<TConversationContext, TEntity>;

/**
 * Creates a new intent resolver that uses the specified set of intent recognizers and enrichers.
 * @param recognizer The recognizer to use to identify the intent.
 * @param enricher An optional enricher that should be used to enrich the recognized intent.
 */
export function createIntentResolver<TConversationContext, TRecognizedEntity extends Entity, TEnrichedEntity extends Entity>(
    recognizer: IIntentRecognizer<TConversationContext, TRecognizedEntity>,
    enricher?: IIntentEnricher<TConversationContext, TRecognizedEntity, TEnrichedEntity>): IIntentResolver<TConversationContext, TRecognizedEntity|TEnrichedEntity> {
    return {
        processUtterance: async (c, u) => {
            debugLogger("Processing utterance: %s", u);

            const recognizedIntent = await recognizer.recognize(c, u);

            // If there was no result from the reognizer, return null
            if (recognizedIntent === null) {
                debugLogger("Processing utterance: %s", null);

                return null;
            }

            debugLogger("Recognized intent: %o", recognizedIntent);

            if (!enricher) {
                debugLogger("No enricher configured, just returning originally recognized intent.");

                return recognizedIntent;
            }

            const enrichedRecognizedIntent = await enricher.enrich(c, recognizedIntent);

            debugLogger("Final, enriched recognized intent: %o", enrichedRecognizedIntent);

            return enrichedRecognizedIntent;
        },
    };
}
