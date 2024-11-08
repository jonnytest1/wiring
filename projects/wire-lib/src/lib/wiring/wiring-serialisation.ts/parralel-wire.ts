import type { FromJsonOptions } from '../serialisation';
import { Wire } from '../wirings/wire';
import { SerialisationFactory, type SerialisationReturn } from './serialisation-factory';

export class ParralelWireSerialsiation extends SerialisationFactory<Wire, 4> {

    override factory = Wire;

    typeName = "ParrallelWire"


    private wireMap: Record<string, Wire> = {}

    override fromJSON(json: any, context: FromJsonOptions): SerialisationReturn<Wire> {

        if (this.wireMap[json.uuid]) {
            this.wireMap[json.uuid].connect(context.inC)

        } else {
            const wire = new Wire()
            //wire.instance = json.uuid
            wire.connect(context.inC)
            this.wireMap[json.uuid] = wire
        }
        let returnWire: Wire
        for (const out of json.outC) {

            if (out == "BatteryRef") {
                returnWire = this.wireMap[json.uuid];
                continue
            }
            const connected = context.loadElement(out, { ...context, wire: this.wireMap[json.uuid] })
            if (!returnWire) {
                returnWire = connected.wire
            } else if (returnWire !== connected.wire) {
                // cause we throwin away the other connections right now
                debugger
            }

        }
        if (!returnWire) {
            debugger
            /* const tWire = new Wire()
             tWire.connect(this.wireMap[json.uuid])
             return {
                 node: tWire,
                 wire: tWire
             }*/
        }
        return {
            node: this.wireMap[json.uuid],
            wire: returnWire
        }
    }

}