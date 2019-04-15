module.exports = {
    resolver: {
        recognizers: [ {
            "recognize": function(context, utterance) {
                let intent = "unknown";
                let entities = [];

                if (/(let me get|I would like|may I please have|I'd like)/i.test(utterance)) {
                    intent = "order-item";
                    
                    entities.push({ type:"number", value: 10 })
                    entities.push({ type:"string", value: "hamburger" });
                } else if (/(cancel|nevermind|forget it)/i.test(utterance)) {
                    intent = "cancel-order";
                } else if (/(that's all|i'm done|that's it)/i.test(utterance)) {
                    intent = "complete-order";
                }
                
                return Promise.resolve({
                    utterance: utterance,
                    intent: intent,
                    entities: entities,
                });
            }
        }]
    },
}