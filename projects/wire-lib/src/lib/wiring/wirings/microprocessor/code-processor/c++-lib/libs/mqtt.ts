import { ResolvablePromise } from '../../../../../../utils/resolvable-promise';
import { consumeFunction, newClassBound, stringTypeLiteral, type FunctionTypeLiteral, type IntTypeLiteral, type JscppInclude, type StringTypeLiteral, type TypeValue, type VoidTypeLiteral } from '../jscpp';
import mqtt from "mqtt"
export function pubSubLib() {


    let server: string
    let port: number

    let cli: mqtt.MqttClient

    let connected = new ResolvablePromise<void>()
    let callback: TypeValue<FunctionTypeLiteral<VoidTypeLiteral, [StringTypeLiteral, StringTypeLiteral, IntTypeLiteral]>>;
    return {
        "PubSubClient.h": {
            load: (rt) => {
                const pubSubCli = newClassBound<[]>(rt)("PubSubClient", [])
                rt.regFunc((rt, self, serverVar, portV) => {
                    server = rt.getStringFromCharArray(serverVar)
                    port = portV.v

                }, pubSubCli, "setServer", [stringTypeLiteral(rt), rt.intTypeLiteral], rt.voidTypeLiteral)

                rt.regFunc((rt, self, callbackV) => {
                    callback = callbackV
                }, pubSubCli, "setCallback", [rt.functionType(rt.voidTypeLiteral, [stringTypeLiteral(rt), stringTypeLiteral(rt), rt.intTypeLiteral] as const)], rt.voidTypeLiteral)

                rt.regFunc((rt, self, idV, userV, passwdV) => {
                    const user = rt.getStringFromCharArray(userV)
                    const pwd = rt.getStringFromCharArray(passwdV)
                    cli = mqtt.connect({
                        host: server,
                        port: port,
                        username: user,
                        password: pwd
                    })

                    cli.once("connect", () => {
                        connected.resolve()

                        cli.on("message", (t, data) => {
                            if (callback) {
                                const dataString = data.toString()
                                consumeFunction(rt, callback, [rt.makeCharArrayFromString(t), rt.makeCharArrayFromString(dataString), rt.val(rt.intTypeLiteral, dataString.length)])
                            }
                        })
                    })

                    cli.on("error", e => {
                        debugger
                    })

                }, pubSubCli, "connect", [stringTypeLiteral(rt), stringTypeLiteral(rt), stringTypeLiteral(rt)], rt.voidTypeLiteral)


                rt.regFunc((rt, self, topicV) => {
                    const topic = rt.getStringFromCharArray(topicV)
                    connected.then(() => {
                        cli.subscribe(topic)
                    })
                }, pubSubCli, "subscribe", [stringTypeLiteral(rt)], rt.voidTypeLiteral)

                rt.regFunc((rt, self, topicV, dataV) => {
                    const topic = rt.getStringFromCharArray(topicV)
                    const data = rt.getStringFromCharArray(dataV)
                    connected.then(() => {
                        console.log(topic, data)
                        cli.publish(topic, data)
                    })
                }, pubSubCli, "publish", [stringTypeLiteral(rt), stringTypeLiteral(rt)], rt.voidTypeLiteral)
            }
        }
    } satisfies JscppInclude
}