import { Entity } from "conversation-processor";
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

export interface TokenFlowEnrichedEntity extends Entity {
    readonly entityToken: EntityToken;
}

export function isTokenFlowEnrichedEntity(entity: Entity): entity is TokenFlowEnrichedEntity {
    return (entity as TokenFlowEnrichedEntity).entityToken !== undefined;
}