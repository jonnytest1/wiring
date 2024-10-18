import { JsonSerializer, type FromJsonOptions } from '../serialisation';
import { Switch } from '../wirings/switch';
import type { Wire } from '../wirings/wire';
import { SerialisationFactory } from './serialisation-factory';

export class SwitchFactory extends SerialisationFactory<Switch> {
    override factory = Switch;
    override fromJSON(json: any, context: FromJsonOptions): { node: Switch; wire: Wire; } {
        const self = new Switch();
        self.enabled = json.enabled ?? false
        if (context.wire) {
            context.wire.connect(self.inC)
        }
        if (json.controlRef) {
            context.controlRefs[json.controlRef] = [self]
        } else {
            JsonSerializer.createUiRepresation(self, json, context)
        }
        const connected = context.loadElement(json.outC, { ...context, inC: self.outC })
        if (json.negatedOutC) {
            context.loadElement(json.negatedOutC, { ...context, inC: self.negatedOutC })
        }
        //
        return { ...connected, node: self }
    }

}