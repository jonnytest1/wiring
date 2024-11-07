export function sum(arr: Array<number>) {
    return arr.reduce((partialSum, a) => partialSum + a, 0)
}