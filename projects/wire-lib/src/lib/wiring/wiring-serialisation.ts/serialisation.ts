import { Wiring, IndexableConstructor } from '../wirings/wiring.a';
import type { JsonFnc, JsonSerialisationtype, SerialisationFactory, SerialiseOptinos, UISerialize } from './serialisation-factory';
import { getSErialisers, serialisationMap } from './serialisers';




export function serialise<T extends Wiring>(obj: T, options: Omit<SerialiseOptinos, "nodeObj">) {
    const nodeObj = {} as Partial<UISerialize> & Partial<JsonSerialisationtype>
    let classRef = obj.constructor as (IndexableConstructor & typeof Wiring)

    const originalName = classRef.typeName
    const serialisers = getSErialisers(classRef)

    for (const serialiser of serialisers) {
        const returnObj = genericSerialize(serialiser, obj, {
            ...options,
            nodeObj: nodeObj
        })
        Object.assign(nodeObj, returnObj)
    }

    nodeObj.type = originalName
    if (obj.uiNode) {
        nodeObj.ui = obj.uiNode.toJSON()
    }
    if (obj.nodeUuid) {
        nodeObj.uuid = obj.nodeUuid
    }
    if (obj.name) {
        nodeObj.name = obj.name
    }
    const copy = {
        ...nodeObj
    }
    delete nodeObj.type
    delete nodeObj.ui
    delete nodeObj.uuid

    const ret = Object.assign({
        type: originalName,
    }, {
        uuid: copy.uuid,
        ui: copy.ui,
    }, nodeObj)

    return ret


}
const objoConstructor = ({}).constructor
function genericSerialize<T extends Wiring, S extends SerialisationFactory<Wiring>,>(serialiser: S, obj: T, options: SerialiseOptinos) {

    if (!serialiser) {
        debugger
    }

    const r = (serialiser.map as JsonFnc<Wiring, Partial<UISerialize>>).toJSON(obj, options) as Partial<UISerialize> & Partial<JsonSerialisationtype>

    for (const i in r) {
        if (typeof r[i] == "object" && r[i].constructor !== objoConstructor) {
            if (!([i] instanceof Array)) {

                // doesnt work
                debugger
            }
        }
    }

    //debugger;
    return r;
}


