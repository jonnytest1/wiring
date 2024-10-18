import { JsonSerializer, type FromJsonOptions } from '../serialisation';
import type { Battery } from '../wirings/battery';
import { Transformator } from '../wirings/transformator';
import type { Wire } from '../wirings/wire';
import { SerialisationFactory } from './serialisation-factory';

export class TransformatorSer extends SerialisationFactory<Transformator> {
    override factory = Transformator;

    override fromJSON(json: any, context: FromJsonOptions): { node: Transformator; wire: Wire; } {
        const self = new Transformator();
        self.readFromJson(json)
        if (context.wire) {
            context.wire.connect(self.inC);
        }
        JsonSerializer.createUiRepresation(self, json, context);
        self.providingBattery = context.loadElement(json.providingBattery,
            { ...context, wire: undefined, inC: undefined }) as unknown as Battery;

        const connected = context.loadElement(json.outC, { ...context, inC: self.outC });

        return {
            ...connected,
            node: self,
        };
    }

}