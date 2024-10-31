import { Mesh, type Vector3 } from 'three';

export interface TransformedAsset {
    transformRelative(relativeVector: Vector3): Vector3
}