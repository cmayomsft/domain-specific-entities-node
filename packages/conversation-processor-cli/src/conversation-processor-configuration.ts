import { IIntentEnricher, IIntentRecognizer } from "conversation-processor";

export interface ConversationProcessorConfiguration {
    readonly recognizers: Array<IIntentRecognizer<any, any>>;
    readonly enrichers: Array<IIntentEnricher<any, any>>;
}
