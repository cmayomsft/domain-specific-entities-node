module.exports = {
    recognizers: [ {
            "recognize": function(context, utterance) {
                return Promise.resolve({
                    utterance: utterance,
                    intent: "some-other-intent",
                    entities: [ {
                        name: "entity-from-recognizer",
                        type: "simple",
                    }],
                });
            }
        }],
    enrichers: [ {
        "enrich": function(context, recognizedUtterance) {
            recognizedUtterance.entities.map(e => {
                e.enrichedProp = "enriched value";

                return e;
            })

            recognizedUtterance.entities.push({
                name: "some-other-entity",
                type: "string",
                value: "this is a string entity"
            });
        }
    }]
}