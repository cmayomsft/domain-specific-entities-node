import { Entity } from "./entities";

export interface IIntentResolver<TConversationContext, TEntity extends Entity> {
    processUtterance(context: TConversationContext, utterance: string): Promise<RecognizedIntent<TEntity> | null>;
}

export interface IIntentRecognizer<TConversationContext, TEntity extends Entity> {
    recognize(context: TConversationContext, utterance: string): Promise<RecognizedIntent<TEntity> | null>;
}

export interface IIntentEnricher<TConversationContext, TEntity extends Entity, TEnrichedEntity extends Entity> {
    enrich(context: TConversationContext, recognizedUtterance: RecognizedIntent<TEntity>): Promise<RecognizedIntent<TEnrichedEntity>>;
}

export interface RecognizedIntent<TEntity extends Entity> {
    utterance: string;
    intent: string;
    entities: TEntity[];
}
