import { IIntentEnricher, IIntentRecognizer } from "conversation-processor";
import { createConversationProcessor } from "conversation-processor";

export interface ConversationProcessorConfiguration {
    readonly recognizers: Array<IIntentRecognizer<any, any>>;
    readonly enrichers: Array<IIntentEnricher<any, any>>;
}

// tslint:disable:no-console

export async function loadConverationProcessorFromConfiguration(configFile: string) {
    // Make sure to delete it from the require cache first in case it's already loaded
    const fullConfigFilePath = require.resolve(configFile);

    delete require.cache[fullConfigFilePath];

    const config = await require(fullConfigFilePath) as Partial<ConversationProcessorConfiguration>;

    if (!config.recognizers
            ||
        config.recognizers.length === 0) {
        throw new Error("No intent recognizers are configured.");
    }

    return createConversationProcessor(config.recognizers, ...(config.enrichers ? config.enrichers : []));
}
