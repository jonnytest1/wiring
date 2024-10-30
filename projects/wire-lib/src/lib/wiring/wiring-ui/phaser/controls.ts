
import { Line3, Plane, PlaneGeometry, Raycaster, Vector2, Vector3, type Camera, type Intersection, type Object3D, type Scene } from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import type { GameScene } from './main-scene';


export class CustomControls extends OrbitControls {
    protected _onPointerDown: Function
    protected _onPointerUp: Function


    private raycaster = new Raycaster();

    private pointer = new Vector2();


    private pointerIntersect: Intersection<Object3D>


    private isMoving = false
    plane: Plane;



    constructor(camera: Camera, domEl: HTMLElement, private scene: GameScene) {
        super(camera, domEl)

        this.disconnect()

        domEl.style.cursor = "move"

        const domElWidth = domEl.getBoundingClientRect()

        domEl.addEventListener("pointermove", e => {
            this.pointer.x = (e.clientX / (domElWidth.width)) * 2 - 1;
            this.pointer.y = - (e.clientY / domElWidth.height) * 2 + 1;



            if (!this.isMoving) {
                this.raycaster.setFromCamera(this.pointer, camera);
                const intersects = this.raycaster.intersectObjects(this.scene.threeScene.children);
                domEl.style.cursor = "move"
                this.pointerIntersect = undefined
                for (let i = 0; i < intersects.length; i++) {
                    if ("transformRelative" in intersects[i].object) {
                        domEl.style.cursor = "crosshair"
                        this.pointerIntersect = intersects[i]
                        break;

                    }
                }
            } else {
                const raycasttVector = new Vector2((e.clientX / (domElWidth.width)) * 2 - 1, - (e.clientY / domElWidth.height) * 2 + 1)

                const origin = new Vector3().setFromMatrixPosition(camera.matrixWorld)

                const direction = new Vector3().set(raycasttVector.x, raycasttVector.y, 0.5)
                    .unproject(camera)
                    .sub(origin)
                    .normalize();


                direction.setLength(this.plane.distanceToPoint(origin) + 100)


                const intersection = this.plane.intersectLine(new Line3(origin, direction), new Vector3())

                this.pointerIntersect.object.position.copy(intersection)

                this.scene.drawWires()
            }
        })


        /* this._onPointerUp = new Proxy(this._onPointerUp, {
             apply: (target, thisArg, argArray) => {
                 this.isMoving = false
                 target.apply(thisArg, argArray)
             }
         })*/


        this._onPointerDown = new Proxy(this._onPointerDown, {
            apply: (target, thisArg, argArray) => {
                if (this.pointerIntersect) {
                    this.isMoving = true
                    const directionVector = camera.position.clone().sub(this.pointerIntersect.point)

                    this.domElement.addEventListener("pointerup", e => {
                        this.isMoving = false
                    }, { once: true })


                    this.plane = new Plane(directionVector)
                    this.plane.translate(this.pointerIntersect.point)

                    return
                }

                target.apply(thisArg, argArray)
            }
        })

        this.connect()

    }
}