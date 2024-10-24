import { JsonSerializer, type FromJsonOptions } from '../serialisation';
import { Relay } from '../wirings/relay';
import type { Wire } from '../wirings/wire';
import { SerialisationFactory } from './serialisation-factory';

export class RelayFactory extends SerialisationFactory<Relay> {

    override factory = Relay;
    override fromJSON(json: any, context: FromJsonOptions): { node: Relay; wire: Wire; } {
        const self = new Relay();
        self.controlRef = json.uuid
        context.controllerRefs[json.uuid] = self;
        if (context.wire) {
            context.wire.connect(self.inC)
        }
        JsonSerializer.createUiRepresation(self, json, context)
        const connected = context.loadElement(json.outC, { ...context, inC: self.outC })

        return { ...connected, node: self }
    }

}