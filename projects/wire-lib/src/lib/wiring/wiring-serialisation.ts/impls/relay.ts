import { JsonSerializer, type FromJsonOptions } from '../../serialisation';
import { Relay } from '../../wirings/relay';
import type { Wire } from '../../wirings/wire';
import { SerialisationFactory, type SerialisationReturn } from '../serialisation-factory';

export class RelayFactory extends SerialisationFactory.of(Relay) {

    map = this.json({
        toJSON(obj, options) {
            return obj.toJSON(options)
        },

        initFromJson(json, context) {
            debugger
            const self = new Relay();
            self.controlRef = json.uuid
            context.references[json.uuid] = self;
            if (context.wire) {
                context.wire.connect(self.inC)
            }
            // const connected = context.loadElement(json.outC, { ...context, inC: self.outC })

            return { node: self }
        },
        applyFromJSON(obj, fromJSON, options) {
            debugger
        },
    })


}