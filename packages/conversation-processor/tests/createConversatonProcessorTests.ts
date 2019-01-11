import { createConversationProcessor } from "../src/index";

describe("createConversationProcessor tests", () => {
   test("empty recognizer set throws", () => {
        expect(() => createConversationProcessor([])).toThrowError();
    });

   test("single recognizer in array, no enrichers", () => {
        const conversationProcessor = createConversationProcessor([ { recognize: async (c, u) => null } ]);

        expect(conversationProcessor).not.toBe(null);
    });

   test("single recognizer, no enrichers", () => {
        const conversationProcessor = createConversationProcessor({ recognize: async (c, u) => null });

        expect(conversationProcessor).not.toBe(null);
    });

   test("multiple recognizers, no enrichers", () => {
        const conversationProcessor = createConversationProcessor([
            { recognize: async (c, u) => null },
            { recognize: async (c, u) => null },
        ]);

        expect(conversationProcessor).not.toBe(null);
    });

   test("single recognizer, single enricher", () => {
        const conversationProcessor = createConversationProcessor(
            [ { recognize: async (c, u) => null } ],
            { enrich: (c, ru) => Promise.resolve() });

        expect(conversationProcessor).not.toBe(null);
    });

   test("single recognizer, multiple enrichers", () => {
        const conversationProcessor = createConversationProcessor(
            [ { recognize: async (c, u) => null } ],
            { enrich: (c, ru) => Promise.resolve() },
            { enrich: (c, ru) => Promise.resolve() });

        expect(conversationProcessor).not.toBe(null);
    });

   test("multiple recognizers, multiple enrichers", () => {
        const conversationProcessor = createConversationProcessor(
            [
                { recognize: async (c, u) => null },
                { recognize: async (c, u) => null },
            ],
            { enrich: (c, ru) => Promise.resolve() },
            { enrich: (c, ru) => Promise.resolve() });

        expect(conversationProcessor).not.toBe(null);
    });
});
