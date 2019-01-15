module.exports = {
    recognizers: [ {
        "recognize": function(context, utterance) {
            return Promise.resolve({
                utterance: utterance,
                intent: "configured-intent",
                entities: [],
            });
        }
    }],
    enrichers: [ {
        "enrich": function(context, recognizedUtterance) {
            recognizedUtterance.entities.push({
                name: "enrichedEntity",
                type: "string",
                value: `hello ${Date.now()}`
            });
        }
    }]
}