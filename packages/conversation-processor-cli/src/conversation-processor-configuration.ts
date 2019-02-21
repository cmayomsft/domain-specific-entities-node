import { createEnricherPipeline, createIntentResolver, createRecognizerChain, Entity, IIntentEnricher, IIntentRecognizer } from "conversation-processor";
import * as path from "path";

export interface IntentResolverConfiguration {
    readonly recognizers: Array<IIntentRecognizer<any, Entity>>;
    readonly enrichers: Array<IIntentEnricher<any, Entity, Entity>>;
}

// tslint:disable:no-console

export async function loadIntentResolverFromConfiguration(configFile: string) {
    // Make sure to delete it from the require cache first in case it's already loaded
    const fullConfigFilePath = path.resolve(configFile);

    delete require.cache[fullConfigFilePath];

    const config = await require(fullConfigFilePath) as Partial<IntentResolverConfiguration>;

    if (!config.recognizers
            ||
        config.recognizers.length === 0) {
        throw new Error("No intent recognizers are configured.");
    }

    return createIntentResolver(createRecognizerChain(config.recognizers), config.enrichers ? createEnricherPipeline(config.enrichers) : undefined);
}
