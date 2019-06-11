import { Entity, RecognizedIntent } from "intentalyzer";
import { FuzzyItemDefinition } from "../src/fuzzy-text-matcher";
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

describe("Individual Entity Transform Tests", () => {
    describe("Factory Tests", () => {
        it("Injests fuzzy match item definitions - empty", () => {
            let wasEnumerated = false;

            function* getFuzzyMatchItemDefinitions(): IterableIterator<FuzzyItemDefinition<TestItemDefinition>> {
                wasEnumerated = true;
            }

            createTokenFlowEntityTransform<any, TestEntity, TestItemDefinition>(
                (e) => e.value,
                getFuzzyMatchItemDefinitions(),
            );

            expect(wasEnumerated).toBe(true);
        });

        it("Injests fuzzy match item definitions - non-empty", () => {
            let wasFullyEnumerated = false;

            function* getFuzzyMatchItemDefinitions(): IterableIterator<FuzzyItemDefinition<TestItemDefinition>> {
                for (let i = 0; i < 10; i++) {
                    yield {
                        pattern: `test ${i}`,
                        match: {
                            id: i,
                            name: `Test Item Definition - ${i}`,
                        },
                    } as FuzzyItemDefinition<TestItemDefinition>;
                }

                wasFullyEnumerated = true;
            }

            createTokenFlowEntityTransform<any, TestEntity, TestItemDefinition>(
                (e) => e.value,
                getFuzzyMatchItemDefinitions(),
            );

            expect(wasFullyEnumerated).toBe(true);
        });
    });

    describe("Transform Tests", () => {
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

        it("Doesn't do anything if no text matches found", async () => {
            const transform = createTokenFlowEntityTransform<any, TestEntity, TestItemDefinition>(
                (e) => e.name === "TestEntityWithWords" ? e.value : undefined,
                [].values(),
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

            expect(transformedIntent).toEqual(originalIntent);
        });
    });
});
