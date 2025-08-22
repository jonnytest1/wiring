
import { Executer } from '../executer';
import "./lib/jscpp"
import type { Esp32 } from '../../esp32';
import {
    consumeFunction, instantiate, newClassBound, stringTypeLiteral, type ArrayTypeLiteral,
    type JscppDebugger,
    type IncludeObj,
    type JscppConfig, type JscppInclude, type Member, type Runtime,
    type StringTypeLiteral, type TypeArg, type TypeValue
} from './jscpp';
import { fastLed } from './libs/fastled';
import { bleLibs } from './libs/ble';




export type CppExecuterParams = {
    includes?: Record<string, IncludeObj | ((evn: CppExecuter) => IncludeObj)>,
    /**
     * jscpp doesnt currently support all features , use this to map code into a form that works
     */
    codemapper?: (code: string) => string
}



export class CppExecuter extends Executer {

    intervals: Array<NodeJS.Timeout> = [];

    code: string
    libs: JscppConfig;

    logs: Array<{ color: string, line: string }> = []

    startime = -1
    params: CppExecuterParams = {}


    debugger: JscppDebugger

    constructor(private environment: Esp32) {
        super()

        this.prepare()
    }


    setEspProvides(esp32Provides: CppExecuterParams) {
        this.params = esp32Provides ?? {}
        this.prepare()
    }
    wrappedCode() {

        let code = this.code;

        code = code.replace(/([A-Za-z]+)::([a-zA-Z]+)/g, "$1Static.$2")

        if (this.params.codemapper) {
            code = this.params.codemapper(code)
        }

        return `
        #include <mainloop>
    ${code}
int main() {
   setup();
   while (true){
      loop();
   }
   return 0;
}`
    }

    prepare() {
        let output = "";

        const mappedLibs = Object.fromEntries(Object.entries(this.params.includes ?? {}).map(([key, val]) => {
            if (typeof val === "function") {
                val = val(this)
            }
            return [key, val];
        }))


        this.libs = {
            includes: {
                ...bleLibs(),
                ...fastLed(this.environment),
                "Arduino.h": {
                    load: (rt) => {
                        rt.regFunc((rt, _this, delay) => {
                            console.log("delay")
                            this.debugger.setStopConditions({
                                isStatement: false,
                                positionChanged: false,
                                lineChanged: true
                            });
                            setTimeout(() => {
                                this.debugger.setStopConditions({
                                    isStatement: false,
                                    positionChanged: false,
                                    lineChanged: false
                                });
                                this.debugger.continue()
                            }, delay.v)
                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "delay", [rt.intTypeLiteral], rt.voidTypeLiteral);

                        rt.regFunc((rt, _this, arg) => {
                            const line = rt.getStringFromCharArray(arg);
                            console.log("c++ : ", line)
                            this.logs.push({
                                color: "black",
                                line: line
                            })
                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "print", [stringTypeLiteral(rt)], rt.voidTypeLiteral);
                        rt.regFunc((rt, _this, arg) => {
                            console.log("c++ : ", arg.v)
                            this.logs.push({
                                color: "black",
                                line: arg.v + ""
                            })
                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "print", [rt.longTypeLiteral], rt.voidTypeLiteral);

                        rt.regFunc((rt, _this) => {

                            let millis = Date.now() - this.startime
                            while (millis > rt.config.limits!.long.max) {
                                millis -= rt.config.limits!.long.max
                            }

                            return rt.val(rt.longTypeLiteral, millis);
                        }, "global", "millis", [], rt.longTypeLiteral);

                    }
                },

                "mainloop": {
                    load: (rt) => {
                        rt.regFunc((rt, _this, setupFnc, loopFnc) => {
                            consumeFunction(rt, setupFnc);
                            consumeFunction(rt, loopFnc);
                            debugger
                            /* this.intervals.push(setInterval(() => {
                                 try {
                                     consumeFunction(rt, loopFnc);
                                 } catch (e) {
                                     console.error(e)
                                     this.logs.push({ color: "red", line: e.stack })
                                 }
                             }, 1000));*/


                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "looptrigger", [rt.functionType(rt.voidTypeLiteral, []), rt.functionType(rt.voidTypeLiteral, [])], rt.voidTypeLiteral);

                        rt.regFunc(function (rt, _this, debugParam) {
                            const debugStr = rt.getStringFromCharArray(debugParam);
                            console.log(debugStr);
                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "debug", [rt.arrayPointerType(rt.charTypeLiteral)], rt.voidTypeLiteral);
                    }
                },
                ...mappedLibs ?? {},
            },
            stdio: {
                write: function (s) {
                    output += s;
                    debugger;
                }
            },
            debug: true
        };
        /* this.pythonInstance = jsPython()
         this.pythonInstance.registerPackagesLoader((p) => {
 
             if (p === "machine") {
                 return {
                     Pin: boundPins(environment), //
                     Timer: this.timer.boundModule()
                 }
             }
 
 
             debugger
             return {}
         })*/


        /*window.JSCPP.visit = new Proxy(window.JSCPP.visit, {
            *apply(target, thisArg, argArray) {
                debugger
            },
        })*/
    }

    override start(): void {
        super.start()
        try {
            this.startime = Date.now()
            this.logs.length = 0

            const finalCode = this.wrappedCode();
            console.log("executing with ", finalCode)
            const returnV = window.JSCPP.run(finalCode, "", this.libs)

            this.debugger = returnV

            this.debugger.setStopConditions({
                isStatement: false,
                positionChanged: false,
                lineChanged: false
            });
            this.debugger.continue()
        } catch (e) {
            console.error(e)
            this.logs.push({ color: "red", line: e.message + "\n" + e.stack.split("\n").slice(0, 2).join("\n") })
        }
    }


    override update(newcode: string): void {
        this.code = newcode

        if (this.running) {
            this.kill()
            this.start()
        }
    }

    override kill(): void {
        super.kill()
        this.environment.setLedMatrix([]);
        this.intervals.forEach(i => clearInterval(i))
        this.intervals = []
    }
}