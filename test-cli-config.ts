import { LUISRuntimeClient } from "@azure/cognitiveservices-luis-runtime";
import { ApiKeyCredentials } from "@azure/ms-rest-js";
import { IntentResolverConfiguration } from "./packages/intentalyzer-cli/src";
import { createLuisIntentRecognizer } from "./packages/luis-integration/src";

export = {
    diffFilter: (path, key) => {
        return false;
    },
    resolver: {
        recognizers: [
            createLuisIntentRecognizer(new LUISRuntimeClient(
                new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": process.env.LUIS_SUBSCRIPTION_KEY! }}),
                process.env.LUIS_ENDPOINT_URL!),
                process.env.LUIS_APP_ID!),
            ],
        },
} as IntentResolverConfiguration;
