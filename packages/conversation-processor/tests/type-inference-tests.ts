import { createEnricherPipeline, createIntentResolver, createRecognizerChain, enrichSpecificIntent, Entity, IIntentEnricher, IIntentRecognizer } from "../src/index";

describe("Type inference tests", () => {
    test("Chained recognizers and enrichers", async () => {
        const processor = createIntentResolver(
            createRecognizerChain(
                createRegexRecognizer(/foo/g),
                createLuisRecognizer(),
            ),
            // createEnricher1(),
            createEnricherPipeline(
                createEnricher1(),
                createEnricher2(),
                enrichSpecificIntent("special-intent-only", createEnricher3()),
            ));

        const ru = await processor.processUtterance({ contextProp: 123 }, "what's can you do?");

        if (ru === null) {
            expect(ru).not.toBeNull();

            return;
        }

        for (const e of ru.entities) {
            if (isEnriched2(e)) {
                e.enrichedProp2;
            }

            if (isEnriched3(e)) {
                e.enrichedProp3;
            }

            switch (e.type) {
                case "regexp":
                    e.value;

                    break;

                case "nlp":
                    e.$rawNlpResult;

                    break;

                case "test-enriched-entity-1":
                    e.enrichedProp1;

                    break;

                default:
                    // TODO: TS should prevent this
                    break;
            }
        }
    });
});

interface RegexpEntity extends Entity {
    readonly type: "regexp";
    readonly value: string;
}

function createRegexRecognizer<TConversationContext>(regexp: RegExp): IIntentRecognizer<TConversationContext, RegexpEntity> {
    return {
        recognize: async (c, u) => {
            const execResults = regexp.exec(u);

            if (!execResults || execResults.length === 0) {
                return null;
            }

            return {
                utterance: u,
                intent: execResults.groups ? execResults.groups.intent : "unknown",
                entities: execResults.map<RegexpEntity>((er, index) => ({ type: "regexp", name: index.toString(), value: er })),
            };
        },
    };
}

interface TestNlpEntity extends Entity {
    readonly type: "nlp";
    readonly $rawNlpResult: any;
}

function createLuisRecognizer<TConversationContext>(): IIntentRecognizer<TConversationContext, TestNlpEntity> {
    return {
        recognize: async (c, u) => {
            return {
                utterance: u,
                intent: "some-luis-determined-intent",
                entities: [ {type: "nlp", name: "first-entity", $rawNlpResult: {} }, { type: "nlp", name: "second-entity", $rawNlpResult: {} }],
            };
        },
    };
}

interface EnrichedEntity1 extends Entity {
    readonly type: "test-enriched-entity-1";
    readonly enrichedProp1: string;
}

interface EnrichedEntity2 extends Entity {
    readonly enrichedProp2: string;
}

function createEnricher1<TConversationContext, TEntity extends Entity>(): IIntentEnricher<TConversationContext, TEntity, TEntity|EnrichedEntity1> {
    return {
        enrich: async (c, ru) => {
            return {
                utterance: ru.utterance,
                intent: ru.intent,
                entities: [...ru.entities, { type: "test-enriched-entity-1", name: "1", enrichedProp1: "prop1" }],
            };
        },
    };
}

function createEnricher2<TConversationContext, TEntity extends Entity>(): IIntentEnricher<TConversationContext, TEntity, TEntity & EnrichedEntity2> {
    return {
        enrich: async (c, ru) => {
            return {
                utterance: ru.utterance,
                intent: ru.intent,
                entities: ru.entities.map((e) => ({ ...e, enrichedProp2: "prop2" })),
            };
        },
    };
}

function isEnriched2(entity: Entity): entity is EnrichedEntity2 {
    return (entity as EnrichedEntity2).enrichedProp2 !== undefined;
}

function createEnricher3<TConversationContext, TEntity extends Entity>(): IIntentEnricher<TConversationContext, TEntity, TEntity & { enrichedProp3: string }> {
    return {
        enrich: async (c, ru) => {
            return {
                utterance: ru.utterance,
                intent: ru.intent,
                entities: ru.entities.map((e) => ({ ...e, enrichedProp3: "prop3" })),
            };
        },
    };
}

function isEnriched3(entity: Entity): entity is Entity & { enrichedProp3: string } {
    return (entity as unknown as { enrichedProp3: string }).enrichedProp3 !== undefined;
}
