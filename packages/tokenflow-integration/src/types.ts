import { Entity } from "conversation-processor";
import { CompositeToken, PID } from "token-flow";

export const ENTITY: unique symbol = Symbol("ENTITY");

export type ENTITY = typeof ENTITY;

export interface TokenFlowEntity extends Entity {
    type: "token-flow";
    $raw: any;
    name: string;
    pid: PID;
}

export interface EntityToken extends CompositeToken {
    type: ENTITY;
    pid: PID;
    name: string;
}
