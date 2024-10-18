import type { FromJsonOptions } from '../serialisation';
import type { Wire } from '../wirings/wire';
import type { Wiring } from '../wirings/wiring.a';
import { BatteryFactory } from './battery-factory';
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
]


const serialisationMap = Object.fromEntries(serialisations.map(s => {
    const instance = new s()
    return [instance.factory.name, instance];
}))


export function startSerialize<T extends Wiring>(json, optinos: FromJsonOptions) {

    Object.values(serialisationMap).forEach(e => e.init())

    return serialize<T>(json, optinos)

}

export type JsonSerialisationtype = { type: string, uuid?: string }


export function serialize<T extends Wiring>(json: JsonSerialisationtype, optinos: FromJsonOptions): {
    node: T,
    wire: Wire
} {

    const serialiser = serialisationMap[json.type]

    const obj = serialiser.fromJSON(json, optinos)
    if (json.uuid) {
        obj.node.nodeUuid = json.uuid
    }

    return obj as SerialisationReturn<T>
}