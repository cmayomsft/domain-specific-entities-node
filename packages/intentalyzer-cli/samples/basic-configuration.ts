import { IntentResolverConfiguration } from "../src/intent-resolver-configuration";

export = {
    resolver: {
        recognizers: [
            {
                recognize: async (context, utterance) => {
                    return {
                        utterance,
                        intent: "configured-intent",
                        entities: [],
                    };
                },
            },
        ],
        enrichers: [
            {
                enrich: async (context, recognizedUtterance) => {
                    return {
                        ...recognizedUtterance,
                        entities: [...recognizedUtterance.entities, {
                            name: "enrichedEntity",
                            type: "string",
                            value: `hello ${Date.now()}`,
                        } ],
                    };
                },
            },
        ],
    },
} as IntentResolverConfiguration;
