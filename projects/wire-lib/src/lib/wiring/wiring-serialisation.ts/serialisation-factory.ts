import type { FromJsonOptions } from '../serialisation';
import type { Wire } from '../wirings/wire';
import type { Wiring } from '../wirings/wiring.a';

export type SerialisationReturn<T extends Wiring> = {
    node: T;
    wire: Wire;
};

export abstract class SerialisationFactory<T extends Wiring> {

    abstract factory: new (...args) => T


    init() {
        // nothing
    }

    abstract fromJSON(fromJSON: { type: string }, options: FromJsonOptions): SerialisationReturn<T>


}
