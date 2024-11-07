export function encodeNumberToChars(num: number) {
    if (num < 0) {
        throw new RangeError('Number must be non-negative.');
    }
    let result = '';
    while (num >= 0) {
        result = String.fromCharCode(97 + (num % 26)) + result;
        num = Math.floor(num / 26) - 1;
        if (num < 0) break;
    }
    return result;
}