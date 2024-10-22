
import { Executer } from '../executer';
import "./lib/jscpp"
import type { Esp32 } from '../../esp32';
import { consumeFunction, instantiate, newClassBound, stringTypeLiteral, type ArrayTypeLiteral, type ClassRef, type ClassTypeLiteral, type FunctionTypeLiteral, type JscppConfig, type JscppInclude, type Member, type Runtime, type StringTypeLiteral, type TypeArg, type TypeValue } from './jscpp';




export type CppExecuterParams = {
    includes?: JscppInclude,
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

    constructor(private environment: Esp32, private params: CppExecuterParams = {}) {
        super()

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

        this.libs = {
            includes: {
                ...this.params.includes ?? {},
                //  ...pubSubLib(),
                "Arduino.h": {
                    load: (rt) => {
                        rt.regFunc((rt, _this, setupFnc) => {
                            debugger;
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
                            while (millis > rt.config.limits.long.max) {
                                millis -= rt.config.limits.long.max
                            }

                            return rt.val(rt.longTypeLiteral, millis);
                        }, "global", "millis", [], rt.longTypeLiteral);
                        //TODO
                    }
                },
                "FastLED.h": {
                    load: (rt) => {
                        const ledClass = newClassBound<[StringTypeLiteral]>(rt)("CRGB", [
                            {
                                name: "color" as const,
                                initialize(rt, _this) {
                                    const firstARg = _this.args?.[0];
                                    if (firstARg) {
                                        return _this.args?.[0];
                                    }
                                    return rt.val(rt.arrayPointerType(rt.charTypeLiteral), null);
                                },
                            }
                        ]);
                        rt.regFunc((rt, self, other) => {
                            const color = rt.getMember(other.v, "color");
                            self.v.members.color.v = color;

                        }, ledClass, rt.makeOperatorFuncName("="), [ledClass], rt.voidTypeLiteral);

                        const staticT = newClassBound<[]>(rt)("CRGBStatic", [{
                            name: "Red" as const,
                            initialize<T>(rt: Runtime, _this) {
                                return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("red")]));
                            },
                        }, {
                            name: "Black" as const,
                            initialize(rt, _this) {
                                return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("black")]));
                            },
                        }]);
                        let ledList: TypeValue<ArrayTypeLiteral<typeof ledClass>>;
                        rt.regFunc((rt, self, leds, ct) => {
                            ledList = leds;
                        }, staticT, "addLeds", [rt.arrayPointerType(ledClass), rt.intTypeLiteral], rt.voidTypeLiteral);

                        rt.regFunc(() => {
                            const data = ledList.v.target;

                            const leds: string[][] = [];
                            let index = 0;
                            for (let rowI = 0; rowI < 8; rowI++) {
                                const row = [];
                                leds.push(row);

                                for (let colI = 0; colI < 8; colI++) {
                                    const element = data[index];
                                    const colorMember = rt.getMember(element, "color");

                                    if (colorMember.v == null) {
                                        row.push("transparent");
                                    } else {
                                        const colorString = rt.getStringFromCharArray(colorMember.v);
                                        row.push(colorString);
                                    }

                                    index++;
                                }
                            }


                            this.environment.setLedMatrix(leds);
                        }, staticT, "show", [], rt.voidTypeLiteral);

                        const instance = instantiate(rt, staticT, []);

                        rt.defVar("FastLED", staticT, instance);
                    }
                },
                "mainloop": {
                    load: (rt) => {
                        rt.regFunc((rt, _this, setupFnc, loopFnc) => {
                            consumeFunction(rt, setupFnc);

                            this.intervals.push(setInterval(() => {
                                consumeFunction(rt, loopFnc);
                            }, 1000));


                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "looptrigger", [rt.functionType(rt.voidTypeLiteral, []), rt.functionType(rt.voidTypeLiteral, [])], rt.voidTypeLiteral);

                        rt.regFunc(function (rt, _this, debugParam) {
                            const debugStr = rt.getStringFromCharArray(debugParam);
                            console.log(debugStr);
                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "debug", [rt.arrayPointerType(rt.charTypeLiteral)], rt.voidTypeLiteral);
                    }
                }
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
            console.log(e)
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
