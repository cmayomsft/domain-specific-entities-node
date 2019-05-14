import { Entity } from "intentalyzer";
import { CompositeToken, PID, Token } from "token-flow";

export const ENTITY: unique symbol = Symbol("ENTITY");

export type ENTITY = typeof ENTITY;

export interface TokenFlowEntity extends Entity {
    type: "token-flow";
    $raw: any;
    name: string;
    pid: number;
}

export interface EntityToken extends CompositeToken {
    type: ENTITY;
    pid: PID;
    name: string;
}

export function isEntityToken(token: Token): token is EntityToken {
    return token.type === ENTITY;
}

export interface TokenFlowTransformedEntity extends Entity {
    readonly entityToken: EntityToken;
}

export function isTokenFlowTransformedEntity(entity: Entity): entity is TokenFlowTransformedEntity {
    return (entity as TokenFlowTransformedEntity).entityToken !== undefined;
}
