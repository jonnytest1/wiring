
import { Group, Line3, MOUSE, Plane, PlaneGeometry, Raycaster, Vector2, Vector3, type Camera, type Intersection, type Object3D, type Scene } from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import type { GameScene } from './main-scene';
import type { SharedEventMesh, SharedEvents } from './event';
import type { NodeWithPos } from './scene-data';
import type { Collection } from '../../wirings/collection';
import type { Wiring } from '../../wirings/wiring.a';
import { InteractionGroup, type DropEvent, type EventContext, type EventPropagation, type InteractionPointerEvent, type OnPointerFinishFinshed } from './util/interaction-group';


export type FunctionKeys<T> = {
    [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

export type NonFunctionKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

export class CustomControls extends OrbitControls {
    protected _onPointerDown: Function
    protected _onPointerUp: Function


    private raycaster = new Raycaster();

    private pointer = new Vector2();


    private panBlocked = false
    plane: Plane;


    dragMode = false
    intersects: Array<Intersection<Object3D<SharedEvents>>
    >;
    currentGroup: InteractionGroup;
    activeDrag: {
        fromGroup: InteractionGroup,
        intersection: Intersection<Object3D<SharedEvents>>,
        dragStart: Vector3,
        canDrop?: boolean,
        toGroup?: InteractionGroup
        endPos?: Vector3,
        data
    };

    constructor(private camera: Camera, private domEl: HTMLElement, private scene: GameScene) {
        super(camera, domEl)

        this.disconnect()

        domEl.style.cursor = "move"

        let pointerDownTime = -1;

        domEl.addEventListener("pointermove", e => {
            const domElWidth = domEl.getBoundingClientRect()
            this.pointer.x = (e.clientX / (domElWidth.width)) * 2 - 1;
            this.pointer.y = - (e.clientY / domElWidth.height) * 2 + 1;


            this.raycaster.setFromCamera(this.pointer, camera);
            this.intersects = this.raycaster.intersectObjects(this.scene.children);
            if (!this.activeDrag) {

                domEl.style.cursor = "move"

                this.panBlocked = false

                for (let i = 0; i < this.intersects.length; i++) {
                    let obj = this.intersects[i].object;
                    let stopped = false
                    while (obj.parent instanceof InteractionGroup) {
                        let group = obj.parent
                        obj.parent.onMouseOver?.({
                            domEl: domEl as HTMLCanvasElement,
                            scene: this.scene,
                            object: this.intersects[i].object,
                            startPos: this.intersects[i].point,
                            endPos: this.intersects[i].point,
                            group: group,

                            stopPropagation() {
                                stopped = true
                            },
                        })

                        if (stopped) { break }

                        obj = obj.parent
                    }
                    if (stopped) {
                        break
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

                let obj = this.activeDrag.intersection.object




                const evt: DropEvent & EventContext = {
                    object: obj,
                    startPos: this.activeDrag.dragStart,
                    endPos: intersection,
                    domEl: domEl as HTMLCanvasElement,
                    scene: this.scene,
                    fromGroup: this.activeDrag.fromGroup,
                    data: this.activeDrag.data,
                };

                this.emitEvent(obj, "dragMove", evt, "dragCaptured")

                domEl.style.cursor = "no-drop"
                this.activeDrag.canDrop = false
                this.activeDrag.toGroup = null
                for (const intersect of this.intersects) {

                    this.activeDrag.endPos = intersect.point
                    const canDropReturns = this.emitEvent(intersect.object, "canDrop", evt)

                    for (const ret of canDropReturns) {
                        if (ret.r) {
                            domEl.style.cursor = "zoom-in"
                            this.activeDrag.canDrop = true
                            this.activeDrag.toGroup = ret.group
                            break
                        }
                    }
                }



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
                if (argArray[0].button == 0) {
                    pointerDownTime = Date.now()

                    for (const intersect of this.intersects) {


                        let dragCaptured = false
                        this.emitEvent(intersect.object, "onMouseDown", {
                            domEl: this.domEl as HTMLCanvasElement,
                            scene: this.scene,
                            position: intersect.object.position.clone(),
                            blockPan: () => {
                                this.panBlocked = true
                            },
                            captureDrag: (data) => {
                                // group.dragCaptured = true
                                dragCaptured = true


                                this.activeDrag = {
                                    fromGroup: this.currentGroup,
                                    intersection: intersect,
                                    dragStart: intersect.object.position.clone(),
                                    data
                                }

                                this.currentGroup.dragCaptured = true

                                const directionVector = camera.position.clone().sub(intersect.point)


                                this.domElement.addEventListener("pointerup", e => {
                                    try {
                                        if (this.activeDrag == null) {
                                            return
                                        }


                                        this.activeDrag.fromGroup.dragCaptured = false
                                        const pointerTime = Date.now() - pointerDownTime
                                        if (pointerTime < 100) {


                                            let obj = intersect.object

                                            let stopped = false


                                            this.emitEvent(obj, "onShortClick", {
                                                startPos: this.activeDrag.dragStart,
                                                object: this.activeDrag.intersection.object,
                                                endPos: this.activeDrag.endPos,
                                                domEl: this.domEl as HTMLCanvasElement,
                                                scene: this.scene,
                                                //group: this.activeDrag.fromGroup,
                                            })
                                        } else if (this.activeDrag.canDrop) {

                                            this.activeDrag.toGroup?.onDrop({
                                                domEl: this.domEl as HTMLCanvasElement,
                                                scene: this.scene,
                                                startPos: this.activeDrag.dragStart,
                                                endPos: this.activeDrag.endPos,
                                                object: this.activeDrag.intersection.object,
                                                fromGroup: this.activeDrag.fromGroup,
                                                group: this.activeDrag.toGroup,
                                                data: this.activeDrag.data,
                                                stopPropagation() {

                                                },
                                            })
                                        }
                                    } finally {
                                        this.activeDrag = null
                                    }

                                }, { once: true })


                                this.plane = new Plane(directionVector)
                                this.plane.translate(intersect.point)


                            },
                        })

                        if (dragCaptured) {
                            return
                        }

                    }


                }


                if (this.panBlocked) {
                    return
                }

                target.apply(thisArg, argArray)
            }
        })

        this.connect()

    }


    private emitEvent<T extends FunctionKeys<Omit<InteractionGroup, keyof Group>>>(obj, type: T, evt: Omit<Parameters<InteractionGroup[T]>[0], keyof EventPropagation>, condition?: NonFunctionKeys<Omit<InteractionGroup, keyof Group>>) {
        let stopped = false
        let returned: Array<{
            group: InteractionGroup,
            r: ReturnType<InteractionGroup[T]>
        }> = []
        while (obj.parent instanceof InteractionGroup) {
            if (!condition || obj.parent[condition]) {
                this.currentGroup = obj.parent
                const eventReseponse = obj.parent[type]?.({
                    ...evt,
                    group: this.currentGroup,
                    stopPropagation() {
                        stopped = true;
                    },
                });
                returned.push({
                    group: this.currentGroup,
                    r: eventReseponse
                })
            }


            if (stopped) {
                break;
            }
            obj = obj.parent

        }

        return returned as Array<{
            group: InteractionGroup,
            r: ReturnType<InteractionGroup[T]>
        }>
    }


    public raycastEvent(event: MouseEvent) {
        const domElWidth = this.domEl.getBoundingClientRect()

        const pointer = new Vector2();
        pointer.x = (event.clientX / (domElWidth.width)) * 2 - 1;
        pointer.y = - (event.clientY / domElWidth.height) * 2 + 1;

        this.raycaster.setFromCamera(pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        return intersects
    }

}