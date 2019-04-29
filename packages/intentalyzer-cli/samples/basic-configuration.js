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
        transforms: [
            {
                apply: function(context, recognizedUtterance) {
                    return { 
                        ...recognizedUtterance, 
                        entities: [...recognizedUtterance.entities, {
                            name: "transformedEntity",
                            type: "string",
                            value: `hello ${Date.now()}`,
                        } ]
                    };
                },
            },
        ],
    },
};
