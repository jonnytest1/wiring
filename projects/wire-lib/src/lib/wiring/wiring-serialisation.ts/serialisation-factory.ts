import type { FromJsonOptions } from '../serialisation';
import type { ParrallelWire } from '../wirings/parrallel-wire';
import type { Wire } from '../wirings/wire';
import type { Indexable, Wiring } from '../wirings/wiring.a';

export type SerialisationReturn<T extends Wiring> = {
    node: T;
    wire: Wire | ParrallelWire;
};

export abstract class SerialisationFactory<T extends Wiring> {

    abstract factory: (new (...args) => T) & Indexable

    init() {
        // nothing
    }

    abstract fromJSON(fromJSON: { type: string }, options: FromJsonOptions): SerialisationReturn<T>


}
