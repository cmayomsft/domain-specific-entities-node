import { Entity, RecognizedIntent } from "intentalyzer";
import { createTokenFlowEntityTransform } from "../src/individual-entity-transformer";
import { isTokenFlowMatchedEntity } from "../src/types";

interface TestItemDefinition {
    id: number;
    name: string;
}

interface TestEntity extends Entity {
    type: "test";
    value: string;
}

describe("createTokenFlowEntityTransform", () => {
    it("Transforms expected entity", async () => {
        const transform = createTokenFlowEntityTransform<any, TestEntity, TestItemDefinition>(
            (e) => e.value,
            [ { pattern: "foo", match: { id: 123, name: "Foo Bar" } }].values(),
        );

        const originalIntent = {
            entities: [ {
                name: "TestEntity",
                type: "test",
                value: "foo",
            } ],
            intent: "test-intent",
            utterance: "Test Utterance",
        } as RecognizedIntent<TestEntity>;

        const transformedIntent = await transform.apply(null, originalIntent);

        const entity = transformedIntent.entities[0];

        if (isTokenFlowMatchedEntity<TestItemDefinition>(entity)) {
            expect(entity.matches.length).toBe(1);
            expect(entity.matches[0].match.id).toBe(123);

            return;
        }

        fail("Expected a token flow matched entity.");
    });

    it("Does not transform intent that contains entities that don't return words", async () => {
        const transform = createTokenFlowEntityTransform<any, TestEntity, TestItemDefinition>(
            (e) => undefined,
            [].values(),
        );

        const originalIntent = {
            entities: [ {
                name: "TestEntity",
                type: "test",
                value: "test",
            } ],
            intent: "test-intent",
            utterance: "Test Utterance",
        } as RecognizedIntent<TestEntity>;

        const transformedIntent = await transform.apply(null, originalIntent);

        expect(transformedIntent).toEqual(originalIntent);
    });

    it("Only transforms entities that produce words", async () => {
        const transform = createTokenFlowEntityTransform<any, TestEntity, TestItemDefinition>(
            (e) => e.name === "TestEntityWithWords" ? e.value : undefined,
            [ { pattern: "foo", match: { id: 123, name: "Foo Bar" } }].values(),
        );

        const originalIntent = {
            entities: [ {
                name: "TestEntityWithWords",
                type: "test",
                value: "foo",
            },
            {
                name: "TestEntityWithoutWords",
                type: "test",
                value: "bar",
            } ],
            intent: "test-intent",
            utterance: "Test Utterance",
        } as RecognizedIntent<TestEntity>;

        const transformedIntent = await transform.apply(null, originalIntent);

        const expectedTransformedEntity = transformedIntent.entities[0];

        if (isTokenFlowMatchedEntity<TestItemDefinition>(expectedTransformedEntity)) {
            expect(expectedTransformedEntity.matches.length).toBe(1);
            expect(expectedTransformedEntity.matches[0].match.id).toBe(123);
        } else {
            fail("Expected first entity to be a token flow matched entity.");
        }

        expect(isTokenFlowMatchedEntity(transformedIntent.entities[1])).toBe(false);
    });
});
