
import { JsonSerializer, type FromJson, type FromJsonOptions, type UIJson } from '../serialisation';
import type { Collection } from '../wirings/collection';
import { ToggleSwitch } from '../wirings/toggle-switch';
import { Wire } from '../wirings/wire';
import type { IndexableConstructor, Wiring } from '../wirings/wiring.a';
import { SerialisationReturn, type JsonFnc, type JsonSerialisationtype, type SerialisationFactory, type UISerialize } from './serialisation-factory';
import { getSErialisers, serialisationMap } from './serialisers';




export function startDeserialize<T extends Wiring>(json, optinos: FromJsonOptions) {
    optinos.uiSerialisationMap ??= new Map()


    const serializerClasses: Array<FromJson> = [Wire, ToggleSwitch];
    /* for (const val of serializerClasses) {
        
         optinos.uiSerialisationMap.set
 
         this.serialisationMap.set(val.name, {
             nodeFactory: val,
             uiFactory: null
         })
     }*/




    Object.values(serialisationMap).forEach(e => {
        return e.init();
    })

    return deserialize<T, JsonSerialisationtype & UISerialize>(json, optinos)

}




export function deserialize<T extends Wiring, S extends JsonSerialisationtype & UISerialize>(json: S, optinos: FromJsonOptions): SerialisationReturn<T> {

    const serialiser = serialisationMap[json.type]

    if (!serialiser?.map?.initFromJson) {
        debugger
        throw new Error("missing serialiser for " + json.type)
    }




    const serializerMap = serialiser.map as JsonFnc<Wiring, Partial<UISerialize>>;

    const obj = serializerMap.initFromJson(json, optinos) as SerialisationReturn<Wiring>

    if ("ui" in json) {
        JsonSerializer.createUiRepresation(obj.node as Collection, json as UIJson, optinos);
    }

    if (json.uuid) {
        obj.node.nodeUuid = json.uuid
    }


    if (json.uuid && optinos.references[json.uuid]) {

        obj.node = optinos.references[json.uuid]

    } else {
        optinos.references[json.uuid] = obj.node
    }

    const serialisers = getSErialisers(obj.node.constructor as (IndexableConstructor & typeof Wiring));


    for (const serialiser of serialisers) {
        if (!serialiser?.map?.applyFromJSON) {
            debugger
            throw new Error("missing serialiser for " + json.type)
        }

        const serializerMap = serialiser.map as JsonFnc<Wiring, Partial<UISerialize>>;

        const returnV = serializerMap.applyFromJSON(obj.node, json, optinos)
        if (returnV) {
            if (returnV.wire) {
                obj.wire = returnV.wire
            }
        }
    }

    return obj as SerialisationReturn<never> as SerialisationReturn<T>
}

