import { LUISRuntimeClient } from "@azure/cognitiveservices-luis-runtime";
import { PredictionGetSlotPredictionOptionalParams } from "@azure/cognitiveservices-luis-runtime/esm/models";
import * as flatMap from "array.prototype.flatmap";
import { default as debug } from "debug";
import { IIntentRecognizer } from "intentalyzer";
import { BasicLuisEntity, LuisCompositeEntity, LuisEntity } from "./types";

flatMap.shim();

const debugLogger = debug("intentalyzer:integration:luis:intent-recognizer");

const PredictionGetSlotOptionalParams: PredictionGetSlotPredictionOptionalParams = { verbose: true, customHeaders: { "User-Agent": "intentalyzer-luis-integration" } };

export function createLuisIntentRecognizer<TConversationContext>(
    luisClient: LUISRuntimeClient,
    appId: string,
    slotName: string = "production"): IIntentRecognizer<TConversationContext, BasicLuisEntity> {
    debugLogger("Creating a LUIS intent recognizer for app '%s' and slot '%s'...", appId, slotName);

    return {
        recognize: async (cc, utterance) => {
            debugLogger("Recognize called for utterance: %s", utterance);

            debugLogger("Calling LUIS...");

            const luisResult = await luisClient.prediction.getSlotPrediction(appId, slotName, { query: utterance }, PredictionGetSlotOptionalParams);

            debugLogger("LUIS returned a result: %O", luisResult);

            const prediction = luisResult.prediction;
            const topIntentName = prediction.topIntent;

            if (!topIntentName) {
                debugLogger("LUIS didn't recognize any intent.");

                return null;
            }

            const topIntent = prediction.intents[topIntentName];

            debugLogger("Top scoring intent was '%s' with a score of %f.", topIntentName, topIntent.score);

            let normalizedEntities: BasicLuisEntity[];

            if (prediction.entities) {
                normalizedEntities = mapEntities(prediction.entities);
            } else {
                debugLogger("No entities to map.");

                normalizedEntities = [];
            }

            return {
                utterance,
                intent: topIntentName ? topIntentName : "<unknown>",
                entities: normalizedEntities,
            };
        },
    };
}

function mapEntities(entities: any): BasicLuisEntity[] {
    const predictionInstanceDetails = entities.$instance;
    const entityEntries = Object.entries(entities).filter(([key]) => key !== "$instance");

    debugLogger("Mapping %i entities...", entityEntries.length);

    const results = entityEntries.flatMap(([key, values]) => {
        const entityInstanceDetails = predictionInstanceDetails[key];

        return (values as any[]).flatMap((value, index) => mapEntity(key, value, entityInstanceDetails[index]));
    });

    debugLogger("Mapped %i entities", results.length);

    return results;
}

function mapEntity(name: string, value: any, entityInstanceDetails: any): BasicLuisEntity|BasicLuisEntity[] {
    // If the value object contains the $instance property we use that as a sign it's a composite entity
    if (value.$instance) {
        return mapCompositeEntity(name, value, entityInstanceDetails);
    }

    // If there is more than one value then we need to map out an instance for each value
    if (Array.isArray(value)) {
        debugLogger("Mapping entity '%s' with multiple (%i) values...", name, value.length);

        return value.map((v) => mapSingleEntityValue(name, v, entityInstanceDetails));
    }

    debugLogger("Mapping entity '%s' with single value...", name, value.length);

    // There's only a single value, just map it to a single entity instance
    return mapSingleEntityValue(name, value, entityInstanceDetails);
}

function mapSingleEntityValue(name: string, value: any, entityInstanceDetails: any): LuisEntity {
    const role = entityInstanceDetails.role;

    return {
        $raw: entityInstanceDetails,
        name: role !== undefined ? role : name,
        type: "luis",
        value,
        utteranceOffsets: {
            startIndex: entityInstanceDetails.startIndex,
            endIndex: entityInstanceDetails.startIndex + entityInstanceDetails.length - 1,
        },
        score: entityInstanceDetails.score,
        resolution: entityInstanceDetails.resolution,
    };
}

function mapCompositeEntity(name: string, rawLuisCompositeEntity: any, entityInstanceDetails: any): LuisCompositeEntity {
    debugLogger("Mapping composite entity '%s'...", name);

    return {
        $raw: rawLuisCompositeEntity,
        name,
        value: entityInstanceDetails.text,
        type: "luis.composite",
        children: mapEntities(rawLuisCompositeEntity) as LuisEntity[],
    };
}
