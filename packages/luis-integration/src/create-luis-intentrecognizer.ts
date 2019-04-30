import { LUISRuntimeClient, LUISRuntimeModels } from "@azure/cognitiveservices-luis-runtime";
import { default as debug } from "debug";
import { IIntentRecognizer } from "intentalyzer";
import { BasicLuisEntity, LuisCompositeEntity, LuisEntity } from "./types";

const debugLogger = debug("intentalyzer:integration:luis:intent-recognizer");

export function createLuisIntentRecognizer<TConversationContext>(luisClient: LUISRuntimeClient, appId: string, luisPredictionResolveOptions?: LUISRuntimeModels.PredictionResolveOptionalParams): IIntentRecognizer<TConversationContext, BasicLuisEntity> {
    debugLogger("Creating a LUIS intent recognizer for app '%s' with options: %O", appId, luisPredictionResolveOptions);

    return {
        recognize: async (cc, utterance) => {
            debugLogger("Recognize called for utterance: %s", utterance);

            debugLogger("Calling LUIS...");

            const luisResult = await luisClient.prediction.resolve(appId, utterance, luisPredictionResolveOptions);

            debugLogger("LUIS returned a result: %O", luisResult);

            const topScoringIntent = luisResult.topScoringIntent;

            if (!topScoringIntent) {
                debugLogger("LUIS didn't recognize any intent.");

                return null;
            }

            debugLogger("Top scoring intent was '%s' with a score of %f.", topScoringIntent.intent, topScoringIntent.score);

            const entities = luisResult.entities;
            let normalizedEntities: BasicLuisEntity[];

            if (entities) {
                debugLogger("Mapping %i entities...", entities.length);

                normalizedEntities = entities.map(mapEntity);

                const compositeEntities = luisResult.compositeEntities;

                if (compositeEntities) {
                    debugLogger("Mapping %i composite entities...", compositeEntities.length);

                    normalizedEntities.push(...compositeEntities.map(mapCompositeEntity));
                } else {
                    debugLogger("No composite entities to map.");
                }
            } else {
                debugLogger("No entities to map.");

                normalizedEntities = [];
            }

            return {
                utterance,
                intent: topScoringIntent.intent ? topScoringIntent.intent : "<unknown>",
                entities: normalizedEntities,
            };
        },
    };
}

function mapEntity(luisEntity: LUISRuntimeModels.EntityModel): LuisEntity {
    return {
        $raw: luisEntity,
        name: luisEntity.type,
        type: "luis",
        value: luisEntity.entity,
        utteranceOffsets: {
            startIndex: luisEntity.startIndex,
            endIndex: luisEntity.endIndex,
        },
        score: luisEntity.score,
        resolution: luisEntity.resolution ? (luisEntity as LUISRuntimeModels.EntityWithResolution).resolution : null,
        role: luisEntity.role as string,
    };
}

function mapCompositeEntity(luisCompositeEntity: LUISRuntimeModels.CompositeEntityModel): LuisCompositeEntity {
    return {
        $raw: luisCompositeEntity,
        name: luisCompositeEntity.parentType,
        value: luisCompositeEntity.value,
        type: "luis.composite",
        children: luisCompositeEntity.children.map((c) => ({
            type: c.type,
            value: c.value,
        })),
    };
}
