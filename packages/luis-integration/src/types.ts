import { Entity } from "intentalyzer";

export interface LuisEntityBase extends Entity {
    readonly $raw: any;
    readonly value: string;
}

export interface LuisEntity extends LuisEntityBase {
    readonly type: "luis";
    readonly score?: number;
    readonly resolution?: any;
}

export interface LuisCompositeEntity extends LuisEntityBase {
    readonly type: "luis.composite";
    readonly children: LuisEntity[];
}

export type BasicLuisEntity = LuisEntity | LuisCompositeEntity;

export function isLuisEntity(entity: Entity): entity is LuisEntity {
    return entity.type === "luis" && (entity as LuisEntityBase).$raw !== undefined;
}

export function isLuisCompositeEntity(entity: Entity): entity is LuisCompositeEntity {
    return entity.type === "luis.composite" && (entity as LuisEntityBase).$raw !== undefined;
}
