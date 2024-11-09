import { Connection } from '../../wirings/connection';
import type { Wiring } from '../../wirings/wiring.a';
import { SerialisationFactory, type ConnectorREf, type JsonFnc } from '../serialisation-factory';





type KeyNames<T extends Wiring> = {
    [K in keyof T & string]: T[K] extends Connection ? K : never
}[keyof T & string]
export type ConnectorKeys<T extends Wiring> = {
    connectorNames: Array<KeyNames<T>>
}

type WiringC<W extends Wiring> = new () => W


type ConenctorKeyArray<T extends WiringC<Wiring>> = {
    constructor: T,
    names: T extends WiringC<infer S> ? Array<KeyNames<S>> : never,
    refnames?: T extends WiringC<infer S> ? Array<KeyNames<S>> : never
}



export class DefaultSerializer {

    static for<T extends WiringC<Wiring>>(type: ConenctorKeyArray<T>) {
        class Noop extends SerialisationFactory.of(type.constructor) {
            override map = this.json({
                initFromJson(fromJSON, options) {
                    debugger
                    return {} as any
                },
                toJSON: (obj, o) => {
                    for (const name of type.refnames as Array<string>) {
                        if (o.fromConnection === obj[name]) {
                            return o.refs(obj[name])
                        }
                    }

                    const plain = {} as Record<string, ConnectorREf>;
                    for (const name of type.names as Array<string>) {
                        console.log(`${obj.nodeUuid}:${name}`)
                        plain[name] = o.serialise(obj[name])
                    }
                    return plain
                },
                applyFromJSON: () => {
                    debugger
                    return {} as any
                }
            })

        }
        return Noop
    }
}