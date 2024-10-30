import { Vector3 } from 'three';
import type { Vector2 } from '../../../util/vector';

export function toThreeVector(vector: Vector2, yLEvel: number) {
    return new Vector3(vector.x / 10, yLEvel, vector.y / 10)
}