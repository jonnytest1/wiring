
import { Line3, MOUSE, Plane, PlaneGeometry, Raycaster, Vector2, Vector3, type Camera, type Intersection, type Object3D, type Scene } from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import type { GameScene } from './main-scene';
import type { SharedEventMesh, SharedEvents } from './event';
import type { NodeWithPos } from './scene-data';
import type { Collection } from '../../wirings/collection';
import type { Wiring } from '../../wirings/wiring.a';


export class CustomControls extends OrbitControls {
    protected _onPointerDown: Function
    protected _onPointerUp: Function


    private raycaster = new Raycaster();

    private pointer = new Vector2();


    private pointerIntersect: Intersection<Object3D<SharedEvents>>


    private isMoving = false
    plane: Plane;



    constructor(camera: Camera, domEl: HTMLElement, private scene: GameScene) {
        super(camera, domEl)

        this.disconnect()

        domEl.style.cursor = "move"

        let pointerDownTime = -1;

        domEl.addEventListener("pointermove", e => {
            const domElWidth = domEl.getBoundingClientRect()
            this.pointer.x = (e.clientX / (domElWidth.width)) * 2 - 1;
            this.pointer.y = - (e.clientY / domElWidth.height) * 2 + 1;



            if (!this.isMoving) {
                this.raycaster.setFromCamera(this.pointer, camera);
                const intersects = this.raycaster.intersectObjects(this.scene.children);
                domEl.style.cursor = "move"
                this.pointerIntersect = undefined
                for (let i = 0; i < intersects.length; i++) {
                    if ("transformRelative" in intersects[i].object) {
                        domEl.style.cursor = "crosshair"
                        this.pointerIntersect = intersects[i] as Intersection<Object3D<SharedEvents>>
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
                this.pointerIntersect.object.dispatchEvent({ type: "positionupdate" })
                this.scene.drawWires()
            }
        })


        /* this._onPointerUp = new Proxy(this._onPointerUp, {
             apply: (target, thisArg, argArray) => {
                 this.isMoving = false
                 target.apply(thisArg, argArray)
             }
         })*/
        this.mouseButtons.MIDDLE = MOUSE.PAN
        this.mouseButtons.RIGHT = MOUSE.DOLLY


        this._onPointerDown = new Proxy(this._onPointerDown, {
            apply: (target, thisArg, argArray) => {
                if (this.pointerIntersect && argArray[0].button == 0) {
                    pointerDownTime = Date.now()

                    let startPosition = this.pointerIntersect.object.position.clone()
                    this.isMoving = true
                    const directionVector = camera.position.clone().sub(this.pointerIntersect.point)

                    this.domElement.addEventListener("pointerup", e => {
                        this.isMoving = false

                        const pointerTime = Date.now() - pointerDownTime
                        if (pointerTime < 100) {
                            this.pointerIntersect.object.position.copy(startPosition)

                            this.pointerIntersect.object.dispatchEvent({ type: "positionupdate" })
                            const nodeObject = this.pointerIntersect.object as Object3D<SharedEvents> & { node: NodeWithPos<Wiring & Collection> }


                            this.scene.context.router.navigate([], {
                                queryParams: {
                                    active: nodeObject.node.node.nodeUuid
                                },
                                queryParamsHandling: "merge"
                            })
                        }
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