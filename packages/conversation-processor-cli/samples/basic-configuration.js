module.exports = {
    recognizers: [
        {
            "recognize": function(context, utterance) {
                console.log("recognizing utterance...");

                return Promise.resolve({
                    utterance: utterance,
                    intent: "configured-intent",
                    entities: [],
                });
            }
        }
    ]
}