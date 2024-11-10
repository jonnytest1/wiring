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
    in: T extends WiringC<infer S> ? KeyNames<S> : never
}



export class DefaultSerializer {

    static for<T extends WiringC<Wiring>>(type: ConenctorKeyArray<T>) {
        class Noop extends SerialisationFactory.of(type.constructor) {
            override map = this.json({

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
                initFromJson(fromJSON, options) {

                    if ("ref" in fromJSON) {
                        return options.withReference(fromJSON.ref as string, obj => {
                            if ("connectionId" in fromJSON) {
                                for (const name of type.refnames) {
                                    const con = obj[name] as Connection
                                    if (con.id === fromJSON["connectionId"]) {
                                        options.wire.connect(con)
                                        break;
                                    }
                                }
                            } else {
                                debugger
                            }


                        })
                    }

                    const obj = new type.constructor()
                    return {
                        node: obj
                    }

                },

                applyFromJSON: (obj, json, context,) => {
                    if ("ref" in json) {
                        debugger
                        return
                    }

                    if (context.wire) {
                        context.wire.connect(obj[type.in])
                    }


                    for (const name of type.names) {

                        const outConnection = obj[name]
                        //JsonSerializer.createUiRepresation(obj, json, context)
                        const connected = context.loadElement(json[name], { ...context, inC: outConnection });

                    }
                }
            })

        }
        return Noop
    }
}