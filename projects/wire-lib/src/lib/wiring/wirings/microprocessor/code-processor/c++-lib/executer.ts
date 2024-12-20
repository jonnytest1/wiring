
import { Executer } from '../executer';
import "./lib/jscpp"
import type { Esp32 } from '../../esp32';
import {
    consumeFunction, instantiate, newClassBound, stringTypeLiteral, type ArrayTypeLiteral,
    type IncludeObj,
    type JscppConfig, type JscppInclude, type Member, type Runtime,
    type StringTypeLiteral, type TypeArg, type TypeValue
} from './jscpp';
import { fastLed } from './libs/fastled';




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
        if (this.params.codemapper) {
            code = this.params.codemapper(code)
        }

        return `
        #include <mainloop>
    ${code}
int main() {

   looptrigger(setup,loop);
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
                ...fastLed(this.environment),
                "Arduino.h": {
                    load: (rt) => {
                        rt.regFunc((rt, _this, setupFnc) => {
                            console.log("delay")
                            //debugger;
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

                            this.intervals.push(setInterval(() => {
                                try {
                                    consumeFunction(rt, loopFnc);
                                } catch (e) {
                                    console.error(e)
                                    this.logs.push({ color: "red", line: e.stack })
                                }
                            }, 1000));


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


    }

    override start(): void {
        super.start()
        try {
            this.startime = Date.now()
            this.logs.length = 0
            const returnV = window.JSCPP.run(this.wrappedCode(), "", this.libs)
        } catch (e) {
            console.error(e)
            this.logs.push({ color: "red", line: e.stack })
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
