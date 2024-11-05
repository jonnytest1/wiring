import type { FromJsonOptions } from '../serialisation';
import { ParrallelWire } from '../wirings/parrallel-wire';
import { Wire } from '../wirings/wire';
import { SerialisationFactory, type SerialisationReturn } from './serialisation-factory';

export class ParralelWireSerialsiation extends SerialisationFactory<ParrallelWire> {

    override factory = ParrallelWire;
    override fromJSON(json: any, context: FromJsonOptions): SerialisationReturn<ParrallelWire> {
        const wire = new ParrallelWire()
        wire.instance = json.uuid
        wire.newInC(context.inC)


        let returnWire: Wire | ParrallelWire = null

        if (context.controllerRefs[json.uuid]) {
            context.controlRefs[json.uuid] ??= []
            context.controlRefs[json.uuid].push(wire)
        } else {
            context.controllerRefs[json.uuid] = wire
        }

        for (const out of json.outC) {

            if (out == "BatteryRef") {
                returnWire = wire;
                continue
            }
            const connected = context.loadElement(out, { ...context, wire: wire })
            if (!returnWire) {
                returnWire = connected.wire
            }
        }
        if (!returnWire) {
            const tWire = new Wire()
            tWire.connect(wire.newOutC())
            return {
                node: wire,
                wire: tWire
            }
        }
        return {
            node: wire,
            wire: returnWire
        }
    }

}