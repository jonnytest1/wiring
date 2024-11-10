import type { FromJsonOptions } from '../serialisation';
import type { Connection } from '../wirings/connection';
import type { PowerSource } from '../wirings/interfaces/registration';
import type { Wire } from '../wirings/wire';
import type { Indexable, Wiring } from '../wirings/wiring.a';
import type { ReferenceCall } from './ref-call';

export type SerialisationReturn<T extends Wiring> = {
    node: T;
    wire: Wire;
};

export type JsonSerialisationtype = { type: string, uuid?: string, name?: string }

export type UISerialize = {
    ui: {
        x: number,
        y: number,
        rotation?: number
    }
}

export interface ConnectorREf {
    type: string;
    ref: string;
}

export interface Reference {
    ref: string
}


export interface SerialiseOptinos {
    fromConnection: Connection

    refs(con): ConnectorREf

    serialise: (con: Connection) => any
    serialiseWire: (con: Wire) => any
    nodeObj: Record<string, any>




}

export interface JsonFnc<T extends Wiring, S extends Partial<UISerialize> & Partial<JsonSerialisationtype>, DeprecatedProps extends Record<string, unknown> = {}> {
    /**
     * typing
     */
    deprecated?: (p: DeprecatedProps) => void

    toJSON: (obj: T, options: SerialiseOptinos) => S;

    initFromJson(
        fromJSON: (NoInfer<S> & UISerialize & JsonSerialisationtype & DeprecatedProps),
        options: FromJsonOptions<T>
    )
        : Omit<SerialisationReturn<T>, "wire"> | ReferenceCall


    applyFromJSON(
        obj: T,
        fromJSON: (NoInfer<S> & UISerialize & JsonSerialisationtype & DeprecatedProps),
        options: FromJsonOptions<T>
    ): void | Omit<SerialisationReturn<T>, "node">;



}

export abstract class SerialisationFactory<T extends Wiring, index = 0> {



    static of<T extends Wiring>(classRef: (new (...args) => T)) {
        abstract class Temp extends SerialisationFactory<T> {
            override factory: (new (...args: any[]) => T) & Indexable<string>;
            constructor() {
                super()
                this.factory = classRef as (new (...args: any[]) => T) & Indexable<string>
            }
        }

        return Temp
    }

    abstract factory: (new (...args) => T) & Indexable
    abstract map: JsonFnc<T, any>
    init() {
        // nothing
    }
    json<S, D extends Record<string, unknown>>(opts: JsonFnc<T, S, D>) {
        return opts
    }
}
