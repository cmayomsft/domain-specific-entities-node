import { BasicEntity, IIntentEnricher } from "conversation-processor";
import { CompositeRecognizer, Recognizer, WORD } from "token-flow";
import { EntityToken, TokenFlowEntity } from "./types";
import { isStringArray, loadTokenFileIntoPatternRecognizer } from "./utilities";

export type EntityWordSelector<TEntity extends BasicEntity> = (entity: TEntity) => string|undefined;

export interface EntitySourcedTokenFlowEntity extends TokenFlowEntity {
    $sourceEntity: BasicEntity;
}

export function createTokenFlowEntityEnricher<TConversationContext, TEntity extends BasicEntity>(entitySelector: EntityWordSelector<TEntity>, ...recognizers: string[] | Recognizer[]): IIntentEnricher<TConversationContext, TEntity | EntitySourcedTokenFlowEntity> {
    if (recognizers.length === 0) {
        throw new Error("Expected at least one recognizer file/instance to be specified.");
    }
    if (isStringArray(recognizers)) {
        recognizers = recognizers.map(loadTokenFileIntoPatternRecognizer);
    }

    const tokenFlowRecognizer: Recognizer = new CompositeRecognizer(
        recognizers,
        /* debugMode: */ false);

    return {
        enrich: async (cc, ru) => {
            // Map the
            const selectedEntityWords = ru.entities
                .map((e) => ({ Entity: e, Word: entitySelector(e as TEntity) }))
                .filter((ew) => ew.Word);

            // If none of the entities are selected for processing, then we can just return the original RecognizedUtterance
            if (selectedEntityWords.length === 0) {
                return ru;
            }

            const entityTokens = tokenFlowRecognizer.apply(selectedEntityWords.map((ew) => ({ type: WORD, text: ew.Word })));

            // If TokenFlow didn't recognize any entities, then just return the original RecognizedUtterance
            if (entityTokens.length === 0) {
                return ru;
            }

            // Translate the TokenFlow entities into BasicEntity derivitives for this abstraction
            const mappedEntityTokens = entityTokens.map((t, i): EntitySourcedTokenFlowEntity => {
                const et = t as EntityToken; // NOTE: we know only EntityToken subtypes will come out
                return {
                    type: "token-flow",
                    $raw: et,
                    $sourceEntity: selectedEntityWords[i].Entity,
                    name: et.name,
                    pid: et.pid,
                };
            });

            return {
                utterance: ru.utterance,
                intent: ru.intent,
                entities: [...ru.entities, ...mappedEntityTokens],
            };
        },
    };
}
