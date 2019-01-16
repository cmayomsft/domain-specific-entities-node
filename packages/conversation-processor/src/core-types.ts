import { BasicEntity } from "./entities";

export interface IConversationProcessor<TConversationContext, TEntity extends BasicEntity> {
    processUtterance(context: TConversationContext, utterance: string): Promise<RecognizedUtterance<TEntity> | null>;
}

export interface IIntentRecognizer<TConversationContext, TEntity extends BasicEntity> {
    recognize(context: TConversationContext, utterance: string): Promise<RecognizedUtterance<TEntity> | null>;
}

export interface IIntentEnricher<TConversationContext, TEntity extends BasicEntity> {
    enrich(context: TConversationContext, recognizedUtterance: RecognizedUtterance<TEntity>): Promise<void>;
}

export interface RecognizedUtterance<TEntity extends BasicEntity> {
    utterance: string;
    intent: string;
    entities: TEntity[];
}
