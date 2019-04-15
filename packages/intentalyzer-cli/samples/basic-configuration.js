module.exports = {
    resolver: {
        recognizers: [
            {
                recognize: function(context, utterance) {
                    return Promise.resolve({
                        utterance: utterance,
                        intent: "configured-intent",
                        entities: [],
                    });
                },
            },
        ],
        enrichers: [
            {
                enrich: function(context, recognizedUtterance) {
                    return { 
                        ...recognizedUtterance, 
                        entities: [...recognizedUtterance.entities, {
                            name: "enrichedEntity",
                            type: "string",
                            value: `hello ${Date.now()}`,
                        } ]
                    };
                },
            },
        ],
    },
};
