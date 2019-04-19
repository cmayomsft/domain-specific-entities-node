import { LUISRuntimeClient, LUISRuntimeModels } from "@azure/cognitiveservices-luis-runtime";
import { IIntentRecognizer } from "intentalyzer";
import { BasicLuisEntity, LuisCompositeEntity, LuisEntity } from "./types";

export function createLuisIntentRecognizer<TConversationContext>(luisClient: LUISRuntimeClient, appId: string, luisPredictionResolveOptions?: LUISRuntimeModels.PredictionResolveOptionalParams): IIntentRecognizer<TConversationContext, BasicLuisEntity> {
    return {
        recognize: async (cc, utterance) => {
            const luisResult = await luisClient.prediction.resolve(appId, utterance, luisPredictionResolveOptions);
            const topScoringIntent = luisResult.topScoringIntent;

            if (!topScoringIntent) {
                return null;
            }

            let normalizedEntities: BasicLuisEntity[];

            if (luisResult.entities) {
                normalizedEntities = luisResult.entities.map(mapEntity);

                if (luisResult.compositeEntities) {
                    normalizedEntities.push(...luisResult.compositeEntities.map(mapCompositeEntity));
                }
            } else {
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
