import { BasicEntity, createIntentResolver, Entity } from "../src/index";

interface TestConversationContext {
    prop1: string;
    prop2: number;
}

interface FancyTestEntity extends Entity {
    readonly type: "fancyEntity";
    value: { fancy: number};
}

type TestEntity = BasicEntity | FancyTestEntity;

describe("createIntentResolver tests", () => {
   test("recognizer, no enricher", () => {
        const intentResolver = createIntentResolver({ recognize: async (c, u) => null });

        expect(intentResolver).not.toBeNull();
    });

   test("recognizer and enricher", () => {
        const intentResolver = createIntentResolver(
            { recognize: async (c, u) => null },
            { enrich: (c, ru) => Promise.resolve(ru) });

        expect(intentResolver).not.toBeNull();
    });

   test("custom context type only", () => {
        const intentResolver = createIntentResolver<TestConversationContext>(
            { recognize: async (c, u) => null });

        expect(intentResolver).not.toBeNull();
    });

   test("custom context and entity types", () => {
       // tslint:disable:no-console
        const intentResolver = createIntentResolver<TestConversationContext, TestEntity>(
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

                    return ru;
                },
            });

        expect(intentResolver).not.toBeNull();
    });
});
