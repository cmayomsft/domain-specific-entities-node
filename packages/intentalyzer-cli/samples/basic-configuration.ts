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
        transforms: [
            {
                apply: async (context, recognizedUtterance) => {
                    return {
                        ...recognizedUtterance,
                        entities: [...recognizedUtterance.entities, {
                            name: "transformedEntity",
                            type: "string",
                            value: `hello ${Date.now()}`,
                        } ],
                    };
                },
            },
        ],
    },
} as IntentResolverConfiguration;
