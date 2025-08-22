import { type Mesh, type BufferGeometry, type NormalBufferAttributes, type Material, type Object3DEventMap, Vector3, Box3 } from 'three';

export class CollisionHelper<T extends Mesh> {


    meshes: Array<T> = []
    areasComputed: boolean;






    add(clonedMEssh: T) {
        this.meshes.push(clonedMEssh)
    }

    private computeAreas() {
        let max = new Vector3(0, 0, 0)
        let min = new Vector3(Infinity, Infinity, Infinity)

        for (const mesh of this.meshes) {

            const meshBox = new Box3().setFromObject(mesh)

            max.x = Math.max(max.x, meshBox.max.x)
            max.y = Math.max(max.y, meshBox.max.y)
            max.z = Math.max(max.z, meshBox.max.z)

            min.x = Math.min(min.x, meshBox.min.x)
            min.y = Math.min(min.y, meshBox.min.y)
            min.z = Math.min(min.z, meshBox.min.z)
        }

        const meshBox = new Box3(min, max);
        const dimensions = meshBox.getSize(new Vector3()).divideScalar(2)


        const octants: Record<number, Mesh[]> = {
            1: [], 2: [], 3: [], 4: [],
            5: [], 6: [], 7: [], 8: []
        };
        function getOctant({ x, y, z }: { x: number, y: number, z: number }): number {
            if (x >= 0 && y >= 0 && z >= 0) return 1;
            if (x < 0 && y >= 0 && z >= 0) return 2;
            if (x >= 0 && y < 0 && z >= 0) return 3;
            if (x < 0 && y < 0 && z >= 0) return 4;
            if (x >= 0 && y >= 0 && z < 0) return 5;
            if (x < 0 && y >= 0 && z < 0) return 6;
            if (x >= 0 && y < 0 && z < 0) return 7;
            if (x < 0 && y < 0 && z < 0) return 8;

            throw new Error("Unexpected mesh position"); // Shouldn't reach here
        }

        for (const mesh of this.meshes) {
            const meshBox = new Box3().setFromObject(mesh)

            const center = meshBox.getCenter(new Vector3()).sub(dimensions);
            const octant = getOctant(mesh.position);

            octants[octant].push(mesh)



        }




        debugger

        this.areasComputed = true
    }


    intersect(collisionhelper: CollisionHelper<T>) {

        if (!collisionhelper.areasComputed) {
            //   collisionhelper.computeAreas()
        }

        if (!this.areasComputed) {
            //  this.computeAreas()
        }
        const collisions: Array<{
            a: T, b: T
        }> = []
        for (let mesh of this.meshes) {
            const bound = new Box3(new Vector3()).setFromObject(mesh)
            for (let otherMEsh of collisionhelper.meshes) {
                const bouns2 = new Box3(new Vector3()).setFromObject(otherMEsh)

                if (bound.intersectsBox(bouns2)) {
                    collisions.push({
                        b: otherMEsh,
                        a: mesh
                    })
                }


            }
        }
        return collisions
    }

}