import { LUISRuntimeClient, LUISRuntimeModels } from "@azure/cognitiveservices-luis-runtime";
import { BasicEntity, IIntentRecognizer } from "conversation-processor";

export interface LuisEntity extends BasicEntity {
    readonly type: "luis";
    readonly score?: number;
}

export interface LuisCompositeEntity extends LuisEntity {
    readonly luisType: "composite";
    readonly children: LuisEntity[];
}

export interface LuisEntityWithResolution extends LuisEntity {
    readonly luisType: "builtin";
    readonly resolution: any;
}

export function createLuisIntentRecognizer<TConversationContext>(luisClient: LUISRuntimeClient, appId: string, luisPredictionResolveOptions?: LUISRuntimeModels.PredictionResolveOptionalParams): IIntentRecognizer<TConversationContext, LuisEntity> {
    return {
        recognize: async (cc, utterance) => {
            const luisResult = await luisClient.prediction.resolve(appId, utterance, luisPredictionResolveOptions);
            const topScoringIntent = luisResult.topScoringIntent;

            if (!topScoringIntent) {
                return null;
            }

            return {
                utterance,
                intent: topScoringIntent.intent ? topScoringIntent.intent : "<unknown>",
                entities: luisResult.entities ? luisResult.entities.map(mapEntity) : [],
            };
        },
    };
}

function mapEntity(luisEntity: LUISRuntimeModels.EntityModel): LuisEntity|LuisCompositeEntity|LuisEntityWithResolution {
    const baseEntity: LuisEntity = {
        name: luisEntity.entity,
        type: "luis",
        utteranceOffsets: {
            startIndex: luisEntity.startIndex,
            endIndex: luisEntity.endIndex,
        },
        score: luisEntity.score,
    };

    switch (luisEntity.type) {
        case "composite":
            return {
                ...baseEntity,
                luisType: "composite",
                children: [],
            };

        case "builtin":
            return {
                ...baseEntity,
                luisType: "builtin",
                resolution: (luisEntity as LUISRuntimeModels.EntityWithResolution).resolution,
            };

        default:
            return baseEntity;
    }


}
