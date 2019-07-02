import { FuzzyTextMatcher } from "../src/fuzzy-text-matcher";

interface TestItemDefinition {
    id: number;
    name: string;
}

describe("constructor tests", () => {
    test("Empty set of definitions", () => {
        const fuzzyTextMatcher = new FuzzyTextMatcher<TestItemDefinition>([].values());

        expect(fuzzyTextMatcher).not.toBeNull();
     });

    test("Non-empty set of definitions", () => {
        const fuzzyTextMatcher = new FuzzyTextMatcher<TestItemDefinition>([
            { pattern: "one two three", match: { id: 123, name: "One Two Three" }  },
            { pattern: "four five six", match: { id: 456, name: "Four Five Six" }  },
            { pattern: "seven eight nine", match: { id: 789, name: "Seven Eight Nine" }  },
        ].values());

        expect(fuzzyTextMatcher).not.toBeNull();
     });
});

describe("matches tests", () => {
    test("Match no entries", () => {
        const fuzzyTextMatcher = new FuzzyTextMatcher<TestItemDefinition>([].values());

        const matches = fuzzyTextMatcher.matches("one two three");

        expect(matches).not.toBeUndefined();

        expect(matches.length).toBe(0);
    });

    test("Match single entry exactly", () => {
        const fuzzyTextMatcher = new FuzzyTextMatcher<TestItemDefinition>([
            { pattern: "one two three", match: { id: 123, name: "One Two Three" }  },
        ].values());

        const matches = fuzzyTextMatcher.matches("one two three");

        expect(matches).not.toBeUndefined();

        expect(matches.length).toBe(1);

        expect(matches[0].match.id).toBe(123);
    });

    test("Match multiple entries exactly", () => {
        const fuzzyTextMatcher = new FuzzyTextMatcher<TestItemDefinition>([
            { pattern: "one two three", match: { id: 123, name: "One Two Three" }  },
            { pattern: "four five six", match: { id: 456, name: "Four Five Six" }  },
            { pattern: "seven eight nine", match: { id: 789, name: "Seven Eight Nine" }  },
        ].values());

        let matches = fuzzyTextMatcher.matches("one two three");

        expect(matches).not.toBeUndefined();
        expect(matches.length).toBe(1);
        expect(matches[0].match.id).toBe(123);

        matches = fuzzyTextMatcher.matches("four five six");

        expect(matches).not.toBeUndefined();
        expect(matches.length).toBe(1);
        expect(matches[0].match.id).toBe(456);

        matches = fuzzyTextMatcher.matches("seven eight nine");

        expect(matches).not.toBeUndefined();
        expect(matches.length).toBe(1);
        expect(matches[0].match.id).toBe(789);

    });

    test("Match multiple patterns for same result", () => {
        const fuzzyTextMatcher = new FuzzyTextMatcher<TestItemDefinition>([
            { pattern: "valueA", match: { id: 1, name: "A" }  },
            { pattern: "valueA valueB", match: { id: 2, name: "A B" }  },
            { pattern: "valueA valueB valueC", match: { id: 3, name: "A B C" }  },
            { pattern: "valueD valueE valueF", match: { id: 4, name: "D E F" }  },
            { pattern: "valueG valueH valueI", match: { id: 5, name: "G H I" }  },
        ].values());

        let matches = fuzzyTextMatcher.matches("valueA");

        expect(matches).not.toBeUndefined();
        expect(matches.length).toBe(3);
        expect(matches[0].match.id).toBe(1);

        matches = fuzzyTextMatcher.matches("valueB");

        expect(matches).not.toBeUndefined();
        expect(matches.length).toBe(2);
        expect(matches[0].match.id).toBe(2);

        matches = fuzzyTextMatcher.matches("valueC");

        expect(matches).not.toBeUndefined();
        expect(matches.length).toBe(1);
        expect(matches[0].match.id).toBe(3);

    });
});
