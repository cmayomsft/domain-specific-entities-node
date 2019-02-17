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
            const selectedEntityWords = ru.entities
                .map((e) => ({ Entity: e, Word: entitySelector(e as TEntity) }))
                .filter((ew) => ew.Word);

            if (selectedEntityWords.length > 0) {
                const entityTokens = tokenFlowRecognizer.apply(selectedEntityWords.map((ew) => ({ type: WORD, text: ew.Word })));

                if (entityTokens.length > 0) {
                    const normalizedEntityTokens = entityTokens.map((t, i): EntitySourcedTokenFlowEntity => {
                        const et = t as EntityToken; // NOTE: we know only EntityToken subtypes will come out
                        return {
                            type: "token-flow",
                            $raw: et,
                            $sourceEntity: selectedEntityWords[i].Entity,
                            name: et.name,
                            pid: et.pid,
                        };
                    });

                    ru.entities.push(...normalizedEntityTokens);
                }
            }
        },
    };
}
