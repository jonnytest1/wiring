import type { FromJsonOptions } from '../../serialisation';
import { Wire } from '../../wirings/wire';
import type { Wiring } from '../../wirings/wiring.a';
import { SerialisationFactory, type JsonFnc, type SerialisationReturn } from '../serialisation-factory';

export class WireSerialsiation extends SerialisationFactory.of(Wire) {

    override map = this.json({
        deprecated(p) {

        },
        toJSON: (obj, o) => {
            return {
                connectedTo: o.serialiseWire(obj)
            }
        },
        initFromJson(fromJSON, context) {

            const wire = new Wire();
            return {
                wire,
                node: wire
            }
        },
        applyFromJSON: (wire, json, context) => {


            wire.connect(context.inC)


            if ("ref" in json) {
                debugger

                return {
                    wire,
                    node: wire
                }
            }

            if (json.connectedTo && !(json.connectedTo instanceof Array)) {
                json.connectedTo = [json.connectedTo]
            }


            let returnWire: Wire
            for (const connection of json.connectedTo) {
                const connected = context.loadElement(connection, {
                    ...context,
                    wire: context.references[json.uuid] as Wire
                });

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
                node: context.references[json.uuid] as Wire,
                wire: returnWire
            }
        }
    })


}