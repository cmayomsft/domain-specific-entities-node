import { Entity } from "intentalyzer";
import { FuzzyMatchResult } from "./fuzzy-text-matcher";

export interface TokenFlowMatchedEntity<TToken> extends Entity {
    readonly matches: Array<FuzzyMatchResult<TToken>>;
}

export function isTokenFlowMatchedEntity<TToken>(entity: Entity): entity is TokenFlowMatchedEntity<TToken> {
    return (entity as TokenFlowMatchedEntity<TToken>).matches !== undefined;
}
