export interface BasicEntity {
    readonly name: string;
    readonly utteranceOffsets?: {
        startIndex: number;
        endIndex: number;
    };
}

export interface SimpleEntity extends BasicEntity {
    readonly type: "simple";
}

export interface StringEntity extends BasicEntity {
    readonly type: "string";
    value: string;
}

export interface NumberEntity extends BasicEntity {
    readonly type: "number";
    value: number;
}

export type Entity = SimpleEntity | StringEntity | NumberEntity;
