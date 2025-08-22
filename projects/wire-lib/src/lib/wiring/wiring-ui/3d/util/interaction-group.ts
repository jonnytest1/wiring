import { Group, type Object3D, type Vector3 } from 'three';
import type { SharedEvents } from '../event';
import type { GameScene } from '../main-scene';
export interface EventPropagation {
    stopPropagation(): void;

    group: InteractionGroup

}

export interface EventContext {
    domEl: HTMLCanvasElement;
    scene: GameScene
}


export interface InteractionPointerEvent {
    startPos: Vector3;
    object: Object3D<SharedEvents>;
    endPos: Vector3;
    data?: any
}




export type OnPointerFinishFinshed = (ev: InteractionPointerEvent & EventPropagation) => void



interface InteractionMOuseEvent extends EventPropagation {
    domEl: HTMLCanvasElement;
    blockPan(): void;
    captureDrag(data?: any): void;
}


export interface DropEvent extends InteractionPointerEvent {
    fromGroup: InteractionGroup
}


export interface COllsionEvent {
    setHandled(): void,
    event: {
        contact: {

        }
    }

    group1: InteractionGroup
    group2: InteractionGroup
}



export class InteractionGroup extends Group<SharedEvents> {

    dragCaptured?: boolean
    onShortClick?: (evt: InteractionPointerEvent & EventPropagation & EventContext) => void
    onMouseOver?: (context: InteractionPointerEvent & EventPropagation & EventContext) => void
    onMouseDown?: (context: InteractionMOuseEvent & EventPropagation & EventContext & { position: Vector3 }) => void

    dragMove?: (evt: InteractionPointerEvent & EventPropagation & EventContext) => void

    onDrop?: (evt: DropEvent & EventPropagation & EventContext) => void


    canDrop?(evt: DropEvent & EventPropagation & EventContext): boolean


    onCollsion?: (e: COllsionEvent) => void

    onNoCollsion?: (e: COllsionEvent) => void

    onSelected?: (e) => void
    onUnSelected?: (e) => void
}