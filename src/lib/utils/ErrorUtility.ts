class ErrorUtility {
    static isNullOrUndefined(value: unknown): boolean {
        return value === null || value === undefined;
    }
}

export default ErrorUtility;
