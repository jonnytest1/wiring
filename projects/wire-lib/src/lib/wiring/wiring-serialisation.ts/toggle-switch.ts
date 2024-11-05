import type { FromJsonOptions } from '../serialisation'
import { ToggleSwitch } from '../wirings/toggle-switch'
import type { Wire } from '../wirings/wire'
import { SerialisationFactory, type SerialisationReturn } from './serialisation-factory'

export class ToggleSwitchSerialisation extends SerialisationFactory<ToggleSwitch> {

    override factory = ToggleSwitch;
    override fromJSON(json: any, context: FromJsonOptions): SerialisationReturn<ToggleSwitch> {
        const self = new ToggleSwitch();
        self.controlRef = json.controlRef
        if (context.wire) {
            context.wire.connect(self.inC)
        }
        context.controlRefs[json.controlRef] = [self]
        const connected = context.loadElement(json.outC, { ...context, inC: self.outC })
        if (json.negatedOutC) {
            context.loadElement(json.negatedOutC, { ...context, inC: self.negatedOutC })
        }
        //JsonSerializer.createUiRepresation(tSwitch, json, context)
        return {
            ...connected,
            node: self
        }
    }

}