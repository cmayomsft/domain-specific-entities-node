module.exports = {
    resolver: {
        recognizers: [
            {
                recognize: function(context, utterance) {
                    return Promise.resolve({
                        utterance: utterance,
                        intent: "some-other-intent",
                        entities: [
                            {
                                name: "entity-from-recognizer",
                                type: "simple",
                            },
                        ],
                    });
                },
            },
        ],
        transforms: [
            {
                apply: function(context, recognizedUtterance) {
                    return {
                        ...recognizedUtterance,
                        entities: [
                            ...recognizedUtterance.entities.map(e => {
                                e.transformedProp = "transformed value";
        
                                return e;
                            }),
                            {
                                name: "some-other-entity",
                                type: "string",
                                value: "this is a string entity",
                            }
                        ]
                    };
                },
            },
        ],
    },
};
