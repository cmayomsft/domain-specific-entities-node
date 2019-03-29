import { PreFilterFunction } from "deep-diff";
import { createEnricherPipeline, createIntentResolver, createRecognizerChain, Entity, IIntentEnricher, IIntentRecognizer, IIntentResolver } from "intentalyzer";
import * as path from "path";

export interface IntentResolverConfiguration {
    readonly diffFilter?: PreFilterFunction;
    readonly resolver: {
        readonly recognizers?: Array<IIntentRecognizer<any, Entity>>;
        readonly enrichers?: Array<IIntentEnricher<any, Entity, Entity>>;
    } | (() => Promise<IIntentResolver<any, Entity>>);
}

export async function loadIntentResolverConfiguration(configFile: string) {
    // Make sure to delete it from the require cache first in case it's already loaded
    const fullConfigFilePath = path.resolve(configFile);

    delete require.cache[fullConfigFilePath];

    return await require(fullConfigFilePath) as Partial<IntentResolverConfiguration>;
}

export async function createIntentResolverFromConfiguration(configuration: Partial<IntentResolverConfiguration>) {
    const resolver = configuration.resolver;

    if (!resolver) {
        throw new Error("No resolver has been configured.");
    }

    if (typeof resolver === "function") {
        return await resolver();
    }

    if (!resolver.recognizers || resolver.recognizers.length === 0) {
        throw new Error("No recognizers configured for the resolver.");
    }

    return createIntentResolver(createRecognizerChain(resolver.recognizers), resolver.enrichers ? createEnricherPipeline(resolver.enrichers) : undefined);
}

export async function loadIntentResolverFromConfiguration(configFile: string) {
    const config = await loadIntentResolverConfiguration(configFile) as Partial<IntentResolverConfiguration>;

    return createIntentResolverFromConfiguration(config);
}
