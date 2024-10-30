import { BufferGeometry, Line, LineBasicMaterial, type Vector3 } from 'three';

export class LineMesh extends Line {
    constructor(wireFrom: Vector3, wireTo: Vector3) {
        const material = new LineBasicMaterial({ color: 0x0000ff });
        const points = [];
        points.push(wireFrom);
        //points.push(new THREE.Vector3(- 10, 0, 0));
        points.push(wireTo);
        //points.push(new THREE.Vector3(0, 10, 0));
        // points.push(new THREE.Vector3(10, 0, 0));

        const geometry = new BufferGeometry().setFromPoints(points);

        super(geometry, material)
    }
}