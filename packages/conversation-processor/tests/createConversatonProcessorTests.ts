import { BasicEntity, createConversationProcessor, Entity } from "../src/index";

interface TestConversationContext {
    prop1: string;
    prop2: number;
}

interface FancyTestEntity extends BasicEntity {
    readonly type: "fancyEntity";
    value: { fancy: number};
}

type TestEntity = Entity | FancyTestEntity;

describe("createConversationProcessor tests", () => {
   test("empty recognizer set throws", () => {
        expect(() => createConversationProcessor([])).toThrowError();
    });

   test("single recognizer in array, no enrichers", () => {
        const conversationProcessor = createConversationProcessor([ { recognize: async (c, u) => null } ]);

        expect(conversationProcessor).not.toBeNull();
    });

   test("single recognizer, no enrichers", () => {
        const conversationProcessor = createConversationProcessor({ recognize: async (c, u) => null });

        expect(conversationProcessor).not.toBeNull();
    });

   test("multiple recognizers, no enrichers", () => {
        const conversationProcessor = createConversationProcessor([
            { recognize: async (c, u) => null },
            { recognize: async (c, u) => null },
        ]);

        expect(conversationProcessor).not.toBeNull();
    });

   test("single recognizer, single enricher", () => {
        const conversationProcessor = createConversationProcessor(
            [ { recognize: async (c, u) => null } ],
            { enrich: (c, ru) => Promise.resolve() });

        expect(conversationProcessor).not.toBeNull();
    });

   test("single recognizer, multiple enrichers", () => {
        const conversationProcessor = createConversationProcessor(
            [ { recognize: async (c, u) => null } ],
            { enrich: (c, ru) => Promise.resolve() },
            { enrich: (c, ru) => Promise.resolve() });

        expect(conversationProcessor).not.toBeNull();
    });

   test("multiple recognizers, multiple enrichers", () => {
        const conversationProcessor = createConversationProcessor(
            [
                { recognize: async (c, u) => null },
                { recognize: async (c, u) => null },
            ],
            { enrich: (c, ru) => Promise.resolve() },
            { enrich: (c, ru) => Promise.resolve() });

        expect(conversationProcessor).not.toBeNull();
    });

   test("custom context type only", () => {
        const conversationProcessor = createConversationProcessor<TestConversationContext, any>(
            { recognize: async (c, u) => null });

        expect(conversationProcessor).not.toBeNull();
    });

   test("custom context and entity types", () => {
       // tslint:disable:no-console
        const conversationProcessor = createConversationProcessor<TestConversationContext, TestEntity>(
            {
                recognize: async (c, u) => {
                    // Demonstrates that we acces to the  properties of our custom conversation context
                    console.log(c.prop1);

                    return {
                        utterance: u,
                        intent: "foo",
                        entities: [ { name: "bar", type: "fancyEntity", value: { fancy: 123 } }],
                    };
                },
            },
            {
                enrich: async (c, ru) => {
                    const entity = ru.entities[0];

                    // This logic demonstrates type guards work correctly for custom entity type
                    if (entity.type === "fancyEntity") {
                        console.log(entity.value.fancy);
                    } else if (entity.type === "string") {
                        console.log(entity.value);
                    }
                },
            });

        expect(conversationProcessor).not.toBeNull();
    });
});
