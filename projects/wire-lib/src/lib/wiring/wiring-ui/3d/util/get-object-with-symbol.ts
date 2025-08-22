import { Mesh, Object3D } from 'three';

export function getObjectsWithSymbol(obj: Object3D, symbol: symbol) {
    let results: Array<Mesh> = []


    for (const child of obj.children) {
        if (symbol in child && child instanceof Mesh) {
            results.push(child)
        }
        results.push(...getObjectsWithSymbol(child, symbol))
    }

    return results
}