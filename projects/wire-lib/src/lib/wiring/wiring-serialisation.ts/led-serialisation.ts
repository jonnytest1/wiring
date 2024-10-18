import { JsonSerializer, type FromJsonOptions } from '../serialisation';
import { LED } from '../wirings/led';
import { SerialisationFactory } from './serialisation-factory';

export class LedSerializer extends SerialisationFactory<LED> {
    override factory = LED;
    override fromJSON(json: any, context: FromJsonOptions) {
        const self = new LED();
        self.uuid = json.uuid
        JsonSerializer.createUiRepresation(self, json, context)
        if (context.wire) {
            context.wire.connect(self.inC)
        }
        const connected = context.loadElement(json.outC, { ...context, inC: self.outC })

        return {
            wire: connected.wire,
            node: self
        }

    }

}