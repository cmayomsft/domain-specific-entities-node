import { default as debug } from "debug";
import { IIntentRecognizer, IIntentResolver, IIntentTransform } from "./core-types";
import { Entity, SimpleEntity } from "./entities";

const debugLogger = debug("intentalyzer:intent-resolver");

export function createIntentResolver<TEntity extends Entity = SimpleEntity>(
    recognizer: IIntentRecognizer<any, TEntity>,
    transformer?: IIntentTransform<any, TEntity, TEntity>): IIntentResolver<any, TEntity>;

export function createIntentResolver<TConversationContext, TEntity extends Entity = SimpleEntity>(
        recognizer: IIntentRecognizer<TConversationContext, TEntity>,
        transformer?: IIntentTransform<TConversationContext, TEntity, TEntity>): IIntentResolver<TConversationContext, TEntity>;

/**
 * Creates a new intent resolver that uses the specified set of intent recognizers and transforms.
 * @param recognizer The recognizer to use to identify the intent.
 * @param transformer An optional transformer that should be used to transform the recognized intent.
 */
export function createIntentResolver<TConversationContext, TRecognizedEntity extends Entity, TTransformedEntity extends Entity>(
    recognizer: IIntentRecognizer<TConversationContext, TRecognizedEntity>,
    transformer?: IIntentTransform<TConversationContext, TRecognizedEntity, TTransformedEntity>): IIntentResolver<TConversationContext, TRecognizedEntity|TTransformedEntity> {
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

            if (!transformer) {
                debugLogger("No transformer configured, just returning originally recognized intent.");

                return recognizedIntent;
            }

            const transformedRecognizedIntent = await transformer.apply(c, recognizedIntent);

            debugLogger("Final, transformed recognized intent: %o", transformedRecognizedIntent);

            return transformedRecognizedIntent;
        },
    };
}
