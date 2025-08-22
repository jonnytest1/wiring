import { AxesHelper, type Mesh, type Object3D, type Vector2, type Vector3 } from 'three';
import { InteractionGroup } from './interaction-group';
import type { SharedEvents } from '../event';
import type { NodeWithPos } from '../scene-data';
import type { Collection } from '../../../wirings/collection';
import type { Wiring } from '../../../wirings/wiring.a';




let selected: InteractionGroup
let helper: AxesHelper
export function positionable(mesh: Mesh | InteractionGroup) {
    let group: InteractionGroup

    if (mesh instanceof InteractionGroup) {
        group = mesh
    } else {
        group = new InteractionGroup()
        group.add(mesh)
    }

    let offset: Vector3
    group.onMouseOver = e => {
        e.domEl.style.cursor = "crosshair"
    }
    group.onMouseDown = e => {
        offset = e.position.clone().sub(group.position)

        e.blockPan()
        e.captureDrag()

    }

    group.onShortClick = (ctx) => {
        selected?.onUnSelected({

        })
        helper?.removeFromParent()
        selected = group

        selected?.onSelected({

        })


        group.position.copy(ctx.startPos.clone().sub(offset))

        group.dispatchEvent({ type: "positionupdate" })
        helper = new AxesHelper(10);
        helper.position.set(0, 0, 0)
        group.add(helper)
        const nodeObject = ctx.object as Object3D<SharedEvents> & { node: NodeWithPos<Wiring & Collection> }


        if ("node" in nodeObject) {

            ctx.scene.context.router.navigate([], {
                queryParams: {
                    active: nodeObject.node.node.nodeUuid
                },
                queryParamsHandling: "merge"
            })
        }
    }

    group.dragMove = evt => {
        group.position.copy(evt.endPos.clone().sub(offset))
        evt.object.dispatchEvent({ type: "positionupdate" })
        group.dispatchEvent({ type: "positionupdate" })

        evt.scene.drawWires()
    }


    return group


}