import { DynamicList, ExternalEntity } from "@azure/cognitiveservices-luis-runtime/esm/models";
import { CompositeEntity, Entity, isCompositeEntity } from "intentalyzer";

export interface LuisEnrichedConversationContext {
    predictionCallContext?: LuisPredictionCallContext;
}

export function isLuisEnrichedConversationContext(conversationContext: any): conversationContext is LuisEnrichedConversationContext {
    return (conversationContext as LuisEnrichedConversationContext).predictionCallContext !== undefined;
}

export interface LuisPredictionCallContext {
    readonly dynamicLists?: DynamicList[];
    readonly externalEntities?: ExternalEntity[];
}

interface LuisEntityBase extends Entity {
    readonly $raw: any;
    readonly value: any;
}

export interface LuisBasicEntity extends LuisEntityBase {
    readonly type: "luis";
    readonly value: any;
}

/*export interface LuisPrebuiltNumberEntity extends LuisEntityBase {
    readonly type: "luis.number";
    readonly value: number;
}

export interface LuisListEntity extends LuisEntityBase {
    readonly type: "luis.list";
    readonly value: string;
}

export interface LuisSimpleEntity extends LuisEntityBase {
    readonly type: "luis.simple";
    readonly value: string;
    readonly score: number;
}*/

export interface LuisCompositeEntity extends LuisEntityBase, CompositeEntity<LuisBasicEntity> {
    readonly type: "luis.composite";
}

export type LuisEntity = LuisBasicEntity | LuisCompositeEntity;

export function isLuisEntity(entity: Entity): entity is LuisBasicEntity {
    return entity.type === "luis" && (entity as LuisEntityBase).$raw !== undefined;
}

export function isLuisCompositeEntity(entity: Entity): entity is LuisCompositeEntity {
    return entity.type === "luis.composite" && (entity as LuisEntityBase).$raw !== undefined && isCompositeEntity(entity);
}
