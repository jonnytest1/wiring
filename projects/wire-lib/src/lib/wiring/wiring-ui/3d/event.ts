import type { BufferGeometry, Material, Mesh, Object3DEventMap } from 'three';

export type SharedEvents = Object3DEventMap & {
    positionupdate
}



export type SharedEventMesh = Mesh<BufferGeometry, Material | Material[], SharedEvents> 