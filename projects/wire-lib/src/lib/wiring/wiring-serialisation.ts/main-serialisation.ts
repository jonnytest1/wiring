import { NODE_TEMPLATES } from '../node-templates';
import type { FromJson, FromJsonOptions } from '../serialisation';
import { ParrallelWire } from '../wirings/parrallel-wire';
import { ToggleSwitch } from '../wirings/toggle-switch';
import { Wire } from '../wirings/wire';
import type { Wiring } from '../wirings/wiring.a';
import { BatteryFactory } from './battery-factory';
import { Esp32Serial } from './esp-serialisation';
import { LedSerializer } from './led-serialisation';
import { PicoSerialisation } from './pico-serialisation';
import { RelayFactory } from './relay';
import { ResistorSerial } from './resistor';
import type { SerialisationFactory, SerialisationReturn } from './serialisation-factory';
import { SwitchFactory } from './switch';
import { ToggleSwitchSerialisation } from './toggle-switch';
import { TransformatorSer } from './transformator';
import { WireSerialsiation } from './wire-serialsiation';





const serialisations: Array<new () => SerialisationFactory<Wiring>> = [
    BatteryFactory,
    LedSerializer,
    PicoSerialisation,
    RelayFactory,
    ResistorSerial,
    SwitchFactory,
    ToggleSwitchSerialisation,
    TransformatorSer,
    WireSerialsiation,
    Esp32Serial
]


const serialisationMap = Object.fromEntries(serialisations.map(s => {
    const instance = new s()
    return [instance.factory.typeName, instance];
}))


export function startSerialize<T extends Wiring>(json, optinos: FromJsonOptions) {
    optinos.uiSerialisationMap = new Map()


    const serializerClasses: Array<FromJson> = [Wire, ToggleSwitch, ParrallelWire];
    /* for (const val of serializerClasses) {
        
         optinos.uiSerialisationMap.set
 
         this.serialisationMap.set(val.name, {
             nodeFactory: val,
             uiFactory: null
         })
     }*/



    NODE_TEMPLATES.forEach(t => {


        const nodeConstructor = t.prototype.factory() as FromJson<string>

        nodeConstructor.uiConstructor = t;

        optinos.uiSerialisationMap.set(nodeConstructor, t)
    });

    Object.values(serialisationMap).forEach(e => {
        return e.init();
    })

    return serialize<T>(json, optinos)

}

export type JsonSerialisationtype = { type: string, uuid?: string }


export function serialize<T extends Wiring>(json: JsonSerialisationtype, optinos: FromJsonOptions): {
    node: T,
    wire: Wire
} {

    const serialiser = serialisationMap[json.type]

    if (!serialiser) {
        throw new Error("missing serialiser for " + json.type)
    }

    const obj = serialiser.fromJSON(json, optinos)
    if (json.uuid) {
        obj.node.nodeUuid = json.uuid
    }

    return obj as SerialisationReturn<T>
}