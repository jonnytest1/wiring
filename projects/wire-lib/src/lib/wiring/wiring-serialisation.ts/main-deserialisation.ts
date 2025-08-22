
import { ResolvablePromise } from '../../utils/resolvable-promise';
import { JsonSerializer, type FromJson, type FromJsonOptions, type UIJson } from '../serialisation';
import type { Collection } from '../wirings/collection';
import { ToggleSwitch } from '../wirings/toggle-switch';
import { Wire } from '../wirings/wire';
import type { IndexableConstructor, Wiring } from '../wirings/wiring.a';
import { ReferenceCall } from './ref-call';
import { SerialisationReturn, type JsonFnc, type JsonSerialisationtype, type SerialisationFactory, type UISerialize } from './serialisation-factory';
import { getSErialisers, serialisationMap } from './serialisers';




export function startDeserialize<T extends Wiring>(json, optinos: FromJsonOptions): Array<T> {
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


    if (!(json instanceof Array)) {
        json = [json]
    }

    return json.map(js => deserialize<T, JsonSerialisationtype & UISerialize>(js, { ...optinos, firstCall: true }) as T)







}




export function deserialize<T extends Wiring, S extends JsonSerialisationtype & UISerialize>(json: S, optinos: FromJsonOptions): T | ReferenceCall {

    if (optinos.firstCall && optinos.references[json.uuid]) {
        return optinos.references[json.uuid] as T
    }

    const serialiser = serialisationMap[json.type]

    if (!serialiser?.map?.initFromJson) {
        debugger
        throw new Error("missing serialiser for " + json.type)
    }




    const serializerMap = serialiser.map as JsonFnc<Wiring, Partial<UISerialize>>;


    let resolver: ReferenceCall
    optinos.withReference = (a, cb) => {
        if (optinos.references[a]) {
            cb(optinos.references[a] as never)
            return resolver = ReferenceCall.resolve(optinos.references[a])
        }


        const refCall = new ReferenceCall(a, cb);
        optinos.callbacks[a] ??= []
        optinos.callbacks[a].push(refCall)
        resolver = refCall
        return refCall
    }


    const obj = serializerMap.initFromJson(json, { ...optinos, firstCall: false }) as SerialisationReturn<Wiring>

    if (!!resolver || obj instanceof ReferenceCall) {
        return resolver
    }

    let uijson = json as UIJson
    //debugger
    if (!("ui" in json)) {
        uijson["ui"] = {
            x: 50 + (innerWidth - 200) * Math.random(),
            y: 50 + (innerHeight - 100) * Math.random(),
        }
    }
    if (!("ref" in json)) {
        JsonSerializer.createUiRepresation(obj.node as Collection, uijson, optinos);
    }
    if (json.uuid && obj.node) {
        obj.node.nodeUuid = json.uuid
    }
    if (json.name && obj.node) {
        obj.node.name = json.name
    }

    if (json.uuid && optinos.references[json.uuid] && !("ref" in json)) {

        obj.node = optinos.references[json.uuid]

    } else {
        optinos.references[json.uuid] = obj.node
    }


    if (optinos.callbacks[json.uuid]) {
        optinos.callbacks[json.uuid].forEach(pr => pr.resolve(obj.node))
        delete optinos.callbacks[json.uuid]
    }

    const serialisers = getSErialisers(obj.node.constructor as (IndexableConstructor & typeof Wiring));


    for (const serialiser of serialisers) {
        if (!serialiser?.map?.applyFromJSON) {
            debugger
            throw new Error("missing serialiser for " + json.type)
        }

        const serializerMap = serialiser.map as JsonFnc<Wiring, Partial<UISerialize>>;

        const returnV = serializerMap.applyFromJSON(obj.node, json, { ...optinos, firstCall: false })
        if (returnV) {
            if (returnV.wire) {
                obj.wire = returnV.wire
            }
        }
    }
    if (optinos.firstCall) {
        return obj.node as T
    }
    return ReferenceCall.resolve(obj.node as T)
}

