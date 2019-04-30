export interface Entity {
    readonly type: string;
    readonly name: string;
    readonly utteranceOffsets?: {
        startIndex: number;
        endIndex: number;
    };
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
