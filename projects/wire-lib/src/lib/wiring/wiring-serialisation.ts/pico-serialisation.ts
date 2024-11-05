import { JsonSerializer, type FromJsonOptions } from '../serialisation';
import { PiPico } from '../wirings/microprocessor/pipico';
import type { Wire } from '../wirings/wire';
import { SerialisationFactory, type SerialisationReturn } from './serialisation-factory';

export class PicoSerialisation extends SerialisationFactory<PiPico> {

    override factory = PiPico;
    jsonRefPinId: number;

    override init() {
        this.jsonRefPinId = undefined
    }

    override fromJSON(json: any, context: FromJsonOptions): SerialisationReturn<PiPico> {
        if (json.ref) {

            this.jsonRefPinId = json.pinConnection
            return {
                wire: context.wire as Wire,
                node: null
            }
        }
        const piPico = new PiPico()
        piPico.instanceUuid = json.uuid
        if (json.code) {
            piPico.script = json.code
        }
        JsonSerializer.createUiRepresation(piPico, json, context)


        context.wire.connect(piPico.pinMap[piPico.tagMap.inputPwr[0]].con)

        for (const connection in json.connections) {

            const con = piPico.pinMap[+connection]
            const conenctionJson = json.connections[connection]
            con.mode = conenctionJson.mode
            con.outputValue = conenctionJson.outputValue
            const endWire = context.loadElement(conenctionJson.connection, { ...context, inC: con.con })
            endWire.wire.connect(piPico.pinMap[this.jsonRefPinId].con)
        }
        const batteryDef = json.batteryCon
        const batteryConnection = piPico.pinMap[batteryDef.id].con


        return {
            ...context.loadElement(batteryDef.connection, { ...context, inC: batteryConnection }),
            node: piPico
        }

    }

}