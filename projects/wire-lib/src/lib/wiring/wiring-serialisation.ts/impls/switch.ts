import { JsonSerializer, type FromJsonOptions } from '../../serialisation';
import { Switch } from '../../wirings/switch';
import type { Wire } from '../../wirings/wire';
import { SerialisationFactory, type SerialisationReturn } from '../serialisation-factory';

export class SwitchFactory extends SerialisationFactory.of(Switch) {

    map = this.json({
        toJSON(obj, options) {
            debugger

            return {
                ...obj.toJSON(options),
                enabled: obj.enabled,
                negatedOutC: options.serialise(obj.negatedOutC)
            }
        },
        initFromJson(json, context) {
            debugger
            const self = new Switch();
            self.enabled = json.enabled ?? false
            if (context.wire) {
                context.wire.connect(self.inC)
            }

            return { node: self }
        },

        applyFromJSON(obj, json, context) {
            debugger
            const connected = context.loadElement(json.outC, { ...context, inC: json.outC })
            if (json.negatedOutC) {
                context.loadElement(json.negatedOutC, { ...context, inC: json.negatedOutC })
            }
            debugger
            //
            // return { ...connected, node: self }

        },
    })

}