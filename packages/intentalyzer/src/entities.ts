export interface Entity {
    readonly type: string;
    readonly name: string;
    readonly utteranceOffsets?: {
        startIndex: number;
        endIndex: number;
        length?: number;
    };
}

export interface CompositeEntity<TChildEntity extends Entity> extends Entity {
    readonly children: TChildEntity[];
}

export interface SimpleEntity extends Entity {
    readonly type: "simple";
}

export interface StringEntity extends Entity {
    readonly type: "string";
    readonly value: string;
}

export interface NumberEntity extends Entity {
    readonly type: "number";
    readonly value: number;
}

export type BasicEntity = SimpleEntity | StringEntity | NumberEntity;

/**
 * Inspects the given entity to determine if it might be a compsite entity.
 *
 * NOTE: This method simply checks the given entity to see if it has a "children" property
 * that is an Array. It does not attempt to validate that all items in the array conform
 * to the TChildEntity type.
 */
export function isCompositeEntity<TChildEntity extends Entity>(entity: Entity): entity is CompositeEntity<TChildEntity> {
    return Array.isArray((entity as CompositeEntity<TChildEntity>).children);
}
