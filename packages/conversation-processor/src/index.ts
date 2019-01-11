export interface BasicEntity {
    readonly name: string;
}

export interface SimpleEntity extends BasicEntity {
    readonly type: "simple";
}

export interface StringEntity extends BasicEntity {
    readonly type: "string";
    value: string;
}

export interface NumberEntity extends BasicEntity {
    readonly type: "number";
    value: number;
}

export type Entity = SimpleEntity|StringEntity|NumberEntity;

export interface RecognizedUtterance<TEntity extends BasicEntity> {
    utterance: string;
    intent: string;
    entities: TEntity[];
}

export interface IConversationProcessor<TConversationContext, TEntity extends BasicEntity> {
    processUtterance(context: TConversationContext, utterance: string): Promise<RecognizedUtterance<TEntity>|null>;
}

export interface IIntentRecognizer<TConversationContext, TEntity extends BasicEntity> {
    recognize(context: TConversationContext, utterance: string): Promise<RecognizedUtterance<TEntity>|null>;
}

export interface IIntentEnricher<TConversationContext, TEntity extends BasicEntity> {
    enrich(context: TConversationContext, recognizedUtterance: RecognizedUtterance<TEntity>): Promise<void>;
}

/** Creates a new conversation processor that uses the specified set of intent recognizers and enrichers.
 * @param intentRecognizers An array of intent recognizers.
 * @param intentEnrichers An array of intent enrichers.
 */
export function createConversationProcessor<TConversationContext, TEntity extends BasicEntity>(intentRecognizers: IIntentRecognizer<TConversationContext, TEntity>|Array<IIntentRecognizer<TConversationContext, TEntity>>, ...intentEnrichers: Array<IIntentEnricher<TConversationContext, TEntity>>): IConversationProcessor<TConversationContext, TEntity> {
    let intentRecognizerSet: Array<IIntentRecognizer<TConversationContext, TEntity>>;

    // NOTE: we can improve the performance of the algorithm when only a single recognizer in the future if necessary
    if (intentRecognizers instanceof Array) {
        // Make sure at least one recognizer was supplied
        if (intentRecognizers.length === 0) {
            throw new Error("At least one intent recognizer must be supplied.");
        }

        intentRecognizerSet = intentRecognizers;
    } else {
        // If it's not an array, wrap it up in one now
        intentRecognizerSet = [ intentRecognizers ];
    }

    return {
        processUtterance: async (context: TConversationContext, utterance: string) => {
            let recognizedUtterance = null;

            // Enumerate the recognizers one at a time giving each a chance to recognize the intent
            // in the order in which they were supplied
            for (const intentRecognizer of intentRecognizerSet) {
                recognizedUtterance = await intentRecognizer.recognize(context, utterance);

                // If the recognizer recognized the intent, then we proceed to enriching it
                // and then break out of the intent recogniztion loop (e.g. first recognizer wins)
                if (recognizedUtterance !== null) {
                    await enrichRecognizedUtterance(context, recognizedUtterance);

                    break;
                }
            }

            return recognizedUtterance;
        },
    };

    async function enrichRecognizedUtterance(context: TConversationContext, recognizedUtterance: RecognizedUtterance<TEntity>) {
        if (intentEnrichers !== undefined
                &&
            intentEnrichers.length > 0) {
            // Enumerate all the enrichers giving them a chance to enrich the result one at a time
            for (const intentEnricher of intentEnrichers) {
                await intentEnricher.enrich(context, recognizedUtterance);
            }
        }
    }
}
