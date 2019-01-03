import { createConversationProcessor } from "../src/index";

describe("createConversationProcessor tests", () => {
    it("no params results in empty processor", () => {
        createConversationProcessor();
    });
});
