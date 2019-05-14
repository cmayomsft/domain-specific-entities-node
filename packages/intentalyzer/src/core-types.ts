import { Entity } from "./entities";

export interface IIntentResolver<TConversationContext, TEntity extends Entity> {
    processUtterance(context: TConversationContext, utterance: string): Promise<RecognizedIntent<TEntity> | null>;
}

export interface IIntentRecognizer<TConversationContext, TEntity extends Entity> {
    recognize(context: TConversationContext, utterance: string): Promise<RecognizedIntent<TEntity> | null>;
}

export interface IIntentTransform<TConversationContext, TEntity extends Entity, TTransformedEntity extends Entity> {
    apply(context: TConversationContext, recognizedUtterance: RecognizedIntent<TEntity>): Promise<RecognizedIntent<TTransformedEntity>>;
}

export interface RecognizedIntent<TEntity extends Entity> {
    readonly utterance: string;
    readonly intent: string;
    readonly entities: TEntity[];
}
