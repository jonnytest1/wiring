import { isDevMode } from '@angular/core'
import { Wiring, type IndexableConstructor } from '../wirings/wiring.a'
import { BatteryFactory } from './impls/battery-factory'
import { Esp32Serial } from './impls/esp-serialisation'
import { LedSerializer } from './impls/led-serialisation'
import { PicoSerialisation } from './impls/pico-serialisation'
import { RelayFactory } from './impls/relay'
import { ResistorSerial } from './impls/resistor'
import { SwitchFactory } from './impls/switch'
import { ToggleSwitchSerialisation } from './impls/toggle-switch'
import { TransformatorSer } from './impls/transformator'
import { WireSerialsiation } from './impls/wire-serialsiation'
import type { SerialisationFactory } from './serialisation-factory'
import { CapacitorSerialise } from './impls/cap-serial'
import { TransistorSErialisation } from './impls/transistor-serial'
import { DefaultSerializer } from './impls/noop-serializer'
import { OrGate } from '../wirings/or'
import { NotGate } from '../wirings/not'
import { Transistor } from '../wirings/transistor'
import { Comparator } from '../wirings/comparator'

const serialisations = [

    BatteryFactory,
    LedSerializer,
    PicoSerialisation,
    RelayFactory,
    ResistorSerial,
    SwitchFactory,
    ToggleSwitchSerialisation,
    TransformatorSer,
    WireSerialsiation,
    Esp32Serial,
    CapacitorSerialise,
    TransistorSErialisation,
    DefaultSerializer.for({
        constructor: OrGate,
        names: ["out", "gnd"],
        refnames: ["inA", "inB"],
        in: "vcc"
    }),
    DefaultSerializer.for({
        constructor: Comparator,
        names: ["vOut", 'ground'],
        refnames: ['negative', "positive"],
        in: "vcc"
    }),
    DefaultSerializer.for({
        constructor: Transistor,
        names: ["emitter"],
        refnames: ["base"],
        in: "collector"
    }),
    DefaultSerializer.for({
        constructor: NotGate,
        names: ["inverted_out", 'gnd'],
        refnames: ['in'],
        in: "vcc"
    })

] as const satisfies Array<new () => SerialisationFactory<Wiring>>


export const serialisationMap = Object.fromEntries(serialisations.map(s => {
    const instance = new s()

    if (isDevMode() && instance.factory.typeName !== instance.factory.name) {
        debugger
        throw new Error("mismatched factory name")
    }

    let typeName = instance.factory.typeName
    if ("typeName" in instance) {
        // for depreacted serialsiations
        typeName = instance.typeName as string
    }

    return [typeName, instance];
}))





export function getSErialisers(classRef: (IndexableConstructor & typeof Wiring)) {
    let serialisers: Array<typeof serialisationMap[keyof typeof serialisationMap]> = []

    let first = true
    while (classRef !== Wiring) {
        if ("typeName" in classRef) {
            const nodeType = classRef.typeName;


            const serialiser = serialisationMap[nodeType]
            if (!serialiser) {
                if (first) {
                    debugger
                }
            }
            first = false
            if (serialiser) {
                serialisers.push(serialiser)
            }
            classRef = Object.getPrototypeOf(classRef)
        }
    }
    serialisers.reverse()

    return serialisers
}