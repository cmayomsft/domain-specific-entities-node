
/** Helper type guard to detect a string array.  */
export function isStringArray(array: string[]|any[]): array is string[] {
    return typeof array[0] === "string";
}
