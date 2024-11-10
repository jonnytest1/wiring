import { JsonSerializer, type FromJsonOptions } from '../../serialisation';
import { PiPico } from '../../wirings/microprocessor/pipico';
import type { Wire } from '../../wirings/wire';
import { SerialisationFactory, type JsonFnc, type SerialisationReturn } from '../serialisation-factory';

export class PicoSerialisation extends SerialisationFactory<PiPico> {

    override factory = PiPico;
    jsonRefPinId: number;

    override init() {
        this.jsonRefPinId = undefined
    }

    override map = this.json({
        toJSON(obj, options) {
            debugger
            return obj.toJSON(options)
        },
        initFromJson(json, context) {
            if ("ref" in json) {
                this.jsonRefPinId = json.pinConnection
                return {
                    wire: context.wire as Wire,
                    node: context.references[json.ref] as PiPico
                }
            }
            const piPico = new PiPico()

            return {
                node: piPico
            }
        },
        applyFromJSON(piPico, json, context) {

            if ("ref" in json) {
                piPico = context.references[json.ref] as PiPico

                context.wire.connect(piPico.pinMap[json.pinConnection].con)


                return
            }

            if (json.code) {
                piPico.script = json.code
            }

            context.wire.connect(piPico.pinMap[piPico.tagMap.inputPwr[0]].con)

            for (const connection in json.connections) {

                const con = piPico.pinMap[+connection]
                const conenctionJson = json.connections[connection]
                con.mode = conenctionJson.mode
                con.outputValue = conenctionJson.outputValue
                const endWire = context.loadElement(conenctionJson.connection, { ...context, inC: con.con })
                //endWire.wire.connect(piPico.pinMap[this.jsonRefPinId].con)
            }
            const batteryDef = json.batteryCon
            const batteryConnection = piPico.pinMap[batteryDef.id].con

            context.loadElement(batteryDef.connection, { ...context, inC: batteryConnection })
            /*return {
                ...,
                node: piPico
            }*/
        },
    })

}