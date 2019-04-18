import { Entity } from "intentalyzer";

export interface LuisEntityBase extends Entity {
    readonly $raw: any;
    readonly value: string;
}

export interface LuisEntity extends LuisEntityBase {
    readonly type: "luis";
    readonly score?: number;
    readonly resolution?: any;
    readonly role?: string;
}

export interface LuisCompositeEntity extends LuisEntityBase {
    readonly type: "luis.composite";
    readonly children: CompositeEntityChildEntity[];
}

export type BasicLuisEntity = LuisEntity | LuisCompositeEntity;

export interface CompositeEntityChildEntity {
    readonly type: string;
    readonly value: string;
}

export function isLuisEntity(entity: Entity): entity is LuisEntity {
    return entity.type === "luis" && (entity as LuisEntityBase).$raw !== undefined;
}

export function isLuisCompositeEntity(entity: Entity): entity is LuisCompositeEntity {
    return entity.type === "luis.composite" && (entity as LuisEntityBase).$raw !== undefined;
}
