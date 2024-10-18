import type { FromJsonOptions } from '../serialisation';
import { Wire } from '../wirings/wire';
import { SerialisationFactory } from './serialisation-factory';

export class WireSerialsiation extends SerialisationFactory<Wire> {
    override factory = Wire;
    override fromJSON(json: any, context: FromJsonOptions): { node: Wire; wire: Wire; } {
        const wire = new Wire(context.inC);
        if (json.connectedWire == 'BatteryRef') {
            return {
                wire,
                node: wire
            };
        }

        const connected = context.loadElement(json.connectedWire, { ...context, wire });

        return {
            ...connected,
            node: wire,
        };
    }

}