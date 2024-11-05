import { JsonSerializer, type FromJsonOptions } from '../serialisation';
import { Resistor } from '../wirings/resistor';
import type { Wire } from '../wirings/wire';
import { SerialisationFactory, type SerialisationReturn } from './serialisation-factory';

export class ResistorSerial extends SerialisationFactory<Resistor> {

    override factory = Resistor;
    override fromJSON(json: any, context: FromJsonOptions): SerialisationReturn<Resistor> {
        const self = new Resistor(json.resistance);
        self.readFromJson(json)
        if (context.wire) {
            context.wire.connect(self.inC)
        }
        JsonSerializer.createUiRepresation(self, json, context)
        const connected = context.loadElement(json.outC, { ...context, inC: self.outC })

        return { ...connected, node: self }
    }

}