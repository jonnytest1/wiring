import type { Object3D } from 'three';
export const DEG_2_RAD = (Math.PI / 180);
export function rotateDeg(obj: Object3D, degree: number) {
    obj.rotateY(degree * DEG_2_RAD)
}