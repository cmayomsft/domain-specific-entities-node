import { createIntentResolver, createRecognizerChain, createTransformPipeline, Entity, IIntentRecognizer, IIntentTransform, transformSpecificIntent } from "../src/index";

describe("Type inference tests", () => {
    test("Chained recognizers and transforms", async () => {
        const processor = createIntentResolver(
            createRecognizerChain(
                createRegexRecognizer(/foo/g),
                createTestNlpRecognizer(),
            ),
            // createtransformer1(),
            createTransformPipeline(
                createTransformer1(),
                createTransformer2(),
                transformSpecificIntent("special-intent-only", createtransformer3()),
            ));

        const ru = await processor.processUtterance({ contextProp: 123 }, "what can you do?");

        if (ru === null) {
            expect(ru).not.toBeNull();

            return;
        }

        for (const e of ru.entities) {
            if (isTransformed2(e)) {
                e.transformedProp2;
            }

            if (isTransformed3(e)) {
                e.transformedProp2;
                e.transformedProp3;
            }

            switch (e.type) {
                case "regexp":
                    e.value;

                    break;

                case "nlp":
                    e.$rawNlpResult;

                    break;

                case "test-transformed-entity-1":
                    e.transformedProp1;

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

function createTestNlpRecognizer<TConversationContext>(): IIntentRecognizer<TConversationContext, TestNlpEntity> {
    return {
        recognize: async (c, u) => {
            return {
                utterance: u,
                intent: "some-nlp-determined-intent",
                entities: [ {type: "nlp", name: "first-entity", $rawNlpResult: { someRawNlpProperty: "raw" } }, { type: "nlp", name: "second-entity", $rawNlpResult: {} }],
            };
        },
    };
}

interface TransformedEntity1 extends Entity {
    readonly type: "test-transformed-entity-1";
    readonly transformedProp1: string;
}

interface TransformedEntity2 extends Entity {
    readonly transformedProp2: string;
}

function createTransformer1<TConversationContext, TEntity extends Entity>(): IIntentTransform<TConversationContext, TEntity, TEntity|TransformedEntity1> {
    return {
        apply: async (c, ru) => {
            return {
                utterance: ru.utterance,
                intent: ru.intent,
                entities: [...ru.entities, { type: "test-transformed-entity-1", name: "1", transformedProp1: "prop1" }],
            };
        },
    };
}

function createTransformer2<TConversationContext, TEntity extends Entity>(): IIntentTransform<TConversationContext, TEntity, TEntity & TransformedEntity2> {
    return {
        apply: async (c, ru) => {
            return {
                utterance: ru.utterance,
                intent: ru.intent,
                entities: ru.entities.map((e) => ({ ...e, transformedProp2: "prop2" })),
            };
        },
    };
}

function isTransformed2(entity: Entity): entity is TransformedEntity2 {
    return (entity as TransformedEntity2).transformedProp2 !== undefined;
}

function createtransformer3<TConversationContext, TEntity extends Entity>(): IIntentTransform<TConversationContext, TEntity, TEntity & { transformedProp3: string }> {
    return {
        apply: async (c, ru) => {
            return {
                utterance: ru.utterance,
                intent: ru.intent,
                entities: ru.entities.map((e) => ({ ...e, transformedProp3: "prop3" })),
            };
        },
    };
}

function isTransformed3(entity: Entity): entity is Entity & { transformedProp3: string } {
    return (entity as unknown as { transformedProp3: string }).transformedProp3 !== undefined;
}
