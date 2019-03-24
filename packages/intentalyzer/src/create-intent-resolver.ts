import { IIntentEnricher, IIntentRecognizer, IIntentResolver, RecognizedIntent } from "./core-types";
import { Entity, SimpleEntity } from "./entities";

export function createIntentResolver<TEntity extends Entity = SimpleEntity>(
    recognizer: IIntentRecognizer<any, TEntity>,
    enricher?: IIntentEnricher<any, TEntity, TEntity>): IIntentResolver<any, TEntity>;

export function createIntentResolver<TConversationContext, TEntity extends Entity = SimpleEntity>(
        recognizer: IIntentRecognizer<TConversationContext, TEntity>,
        enricher?: IIntentEnricher<TConversationContext, TEntity, TEntity>): IIntentResolver<TConversationContext, TEntity>;

/** Creates a new intent resolver that uses the specified set of intent recognizers and enrichers.
 * @param recognizer The recognizer to use to identify the intent.
 * @param enricher An optional enricher that should be used to enrich the recognized intent.
 */
export function createIntentResolver<TConversationContext, TRecognizedEntity extends Entity, TEnrichedEntity extends Entity>(
    recognizer: IIntentRecognizer<TConversationContext, TRecognizedEntity>,
    enricher?: IIntentEnricher<TConversationContext, TRecognizedEntity, TEnrichedEntity>): IIntentResolver<TConversationContext, TRecognizedEntity|TEnrichedEntity> {
    return {
        processUtterance: async (c, u) => {
            const recognizedUtterance: RecognizedIntent<TRecognizedEntity>|null = await recognizer.recognize(c, u);

            // If there was no  result from the reognizer or there is no enricher, just return the result as is
            if (recognizedUtterance === null || !enricher) {
                return recognizedUtterance;
            }

            return await enricher.enrich(c, recognizedUtterance);
        },
    };
}
