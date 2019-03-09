import { createEnricherPipeline, createIntentResolver, createRecognizerChain, Entity, IIntentEnricher, IIntentRecognizer } from "conversation-processor";
import { PreFilterFunction } from "deep-diff";
import * as path from "path";

export interface IntentResolverConfiguration {
    readonly diffFilter?: PreFilterFunction;
    readonly recognizers: Array<IIntentRecognizer<any, Entity>>;
    readonly enrichers: Array<IIntentEnricher<any, Entity, Entity>>;
}

export async function loadIntentResolverConfiguration(configFile: string) {
    // Make sure to delete it from the require cache first in case it's already loaded
    const fullConfigFilePath = path.resolve(configFile);

    delete require.cache[fullConfigFilePath];

    return await require(fullConfigFilePath) as Partial<IntentResolverConfiguration>;
}

export async function createIntentResolverFromConfiguration(configuration: Partial<IntentResolverConfiguration>) {
    if (!configuration.recognizers
            ||
        configuration.recognizers.length === 0) {
        throw new Error("No recognizer has been configured.");
    }

    return createIntentResolver(createRecognizerChain(configuration.recognizers), configuration.enrichers ? createEnricherPipeline(configuration.enrichers) : undefined);
}

export async function loadIntentResolverFromConfiguration(configFile: string) {
    const config = await loadIntentResolverConfiguration(configFile) as Partial<IntentResolverConfiguration>;

    return createIntentResolverFromConfiguration(config);
}
