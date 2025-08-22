import { Mesh } from 'three';
import { assignSymbol, create } from './typed-symbol';

export interface CollisionMesh {
    collisionGroup: number,
    onCollide: (data: { other: CollisionMesh, handled(): void }) => void,
    data: any
}

export const cannonSymbol = create<CollisionMesh>()


export function assignCollisionMesh(mesh: Mesh, opts: CollisionMesh) {
    return assignSymbol(mesh, cannonSymbol, opts)
}


