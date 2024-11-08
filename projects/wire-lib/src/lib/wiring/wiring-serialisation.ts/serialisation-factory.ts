import type { FromJsonOptions } from '../serialisation';
import type { Wire } from '../wirings/wire';
import type { Indexable, Wiring } from '../wirings/wiring.a';

export type SerialisationReturn<T extends Wiring> = {
    node: T;
    wire: Wire;
};

export abstract class SerialisationFactory<T extends Wiring, index = 0> {



    abstract factory: (new (...args) => T) & Indexable

    init() {
        // nothing
    }

    abstract fromJSON(fromJSON: { type: string }, options: FromJsonOptions): SerialisationReturn<T>


}
