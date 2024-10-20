import { env } from 'process';
import type { MicroProcessorBase } from '../../microprocessor-base';
import { Executer } from '../executer';
import "./lib/JSCPP.js"
import type { Esp32 } from '../../esp32';




type TypeArg = string & { cConstructor?: (rt: Runtime, thisObj, args) => any }


type TypeValue = {
    t: TypeArg,
    v,
    args?: Array<TypeValue>
}
type Runtime = {
    getMember(other: TypeValue, arg1: string): TypeValue;
    makeOperatorFuncName(arg0: string): string;
    makeCharArrayFromString(arg0: string): TypeValue;
    getTypeSignature(staticT: TypeArg): string;
    types: Record<string, TypeArg>;
    defVar(name: string, varType: TypeArg, init: TypeValue): unknown;
    newClass(arg0: string, arg1: { name: string; initialize: (rt: Runtime, _this: TypeValue) => TypeValue; }[], preinit?: (rt: Runtime, args: Array<TypeValue>) => void): TypeArg;
    getStringFromCharArray(of: TypeValue): string;
    arrayPointerType(ofType: TypeArg): TypeArg;
    getCompatibleFunc(scope: string, name: string, args: undefined[]): (rt: Runtime, thisObj, args) => any;
    charTypeLiteral: TypeArg;
    registerTypedef: (def, name: string) => void;
    regFunc: (fnc: (runtime: Runtime, self: any, ...args: Array<TypeValue>) => void, scope: "global" | TypeArg, name: string, args: Array<TypeArg>, returnType: TypeArg) => void
    val: (returnType: TypeArg, value) => TypeValue
    intTypeLiteral: TypeArg
    voidTypeLiteral: TypeArg
    functionType: (retType: TypeArg, args: Array<TypeArg>) => TypeArg
}


declare global {

    interface Window {
        JSCPP: {
            run(code: string, inputStr: string, config: {
                includes: Record<string, {
                    load: (runtime: Runtime) => void
                }>
                stdio
                debug?: boolean
            })
        }
    }
}



export class CppExecuter extends Executer {
    intervals: Array<NodeJS.Timeout> = [];

    code: string


    constructor(environment: Esp32) {
        super()

        this.prepare(environment)
    }

    wrapCode(code: String) {
        return `
        #include <mainloop>
    ${code}
int main() {

   looptrigger(setup,loop);
   return 0;
}`
    }

    prepare(environment: Esp32) {

        const code = this.wrapCode(`
#include <FastLED.h>
#include <Arduino.h>
int NUM_LEDS=64;
int DATA_PIN=14;

CRGB leds[NUM_LEDS];
void setup()
{
    debug("setup");
    FastLED.addLeds(leds, NUM_LEDS);
 
}

int loopCount=0;

void loop()
{

    if (loopCount%2==0){
        leds[0] = FastLED.Red;
        leds[63] = FastLED.Black;
    }else{
        leds[0] = FastLED.Black;
        leds[63] = FastLED.Red;
    }
    debug("test"); 
    FastLED.show();
    loopCount++;

}
            
            
            `)


        let output = "";




        function consumeFunction(rt: Runtime, fnc: TypeValue, args: Array<TypeValue> = []) {
            const ret = []
            for (const val of fnc.v.target(rt, {}, [])) {
                ret.push(val)
            }
            return ret
        }


        function instantiate(rt: Runtime, typeArg: TypeArg, args: Array<TypeValue> = []): TypeValue {
            const classType = rt.types[rt.getTypeSignature(typeArg)]
            const _this = { v: {}, t: typeArg, args }
            classType.cConstructor(rt, _this, args)
            return _this
        }

        /* function makeMemberFunction(rt: Runtime, fnc: (...args: any) => any, boundThis: any, returnType: TypeArg, args: Array<TypeArg>, name: string, parent) {
             const fncType = rt.functionType(returnType, args);
             return {
                 t: fncType,
                 v: {
                     bindThis: boundThis,
                     target: fnc,
                     defineType: parent.t,
                     name: name
                 }
             }
         }*/
        const returnV = window.JSCPP.run(code, "", {
            includes: {
                "Arduino.h": {
                    load: (rt) => {
                        /*rt.regFunc(async function* (rt, _this, setupFnc, loopFnc) {
                            debugger
                            yield delay(10000)
                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "delay", [rt.intTypeLiteral], rt.voidTypeLiteral);*/
                        //TODO
                    }
                },
                "FastLED.h": {
                    load: (rt) => {

                        /**
                         * {
                            name: "show",
                            initialize: (rt, _this) => {
                                return makeMemberFunction(rt, () => {
                                    debugger
                                }, _this)
                            }
                        }
                         */
                        const ledClass = rt.newClass("CRGB", [
                            {
                                name: "color",

                                initialize(rt, _this) {
                                    if (_this.args?.[0]) {
                                        return _this.args?.[0]
                                    }
                                    return rt.val(rt.arrayPointerType(rt.charTypeLiteral), "colorinit")
                                },
                            }
                        ])
                        rt.regFunc((rt, self, other) => {
                            const color = rt.getMember(other.v, "color")
                            self.v.members.color.v = color

                        }, ledClass, rt.makeOperatorFuncName("="), [ledClass], rt.voidTypeLiteral)


                        const staticT = rt.newClass("CRGBStatic", [{
                            name: "Red",
                            initialize(rt, _this) {
                                return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("red")]))
                            },
                        }, {
                            name: "Black",
                            initialize(rt, _this) {
                                return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("black")]))
                            },
                        }])

                        let ledList: TypeValue

                        rt.regFunc((rt, self, leds, ct) => {
                            ledList = leds
                        }, staticT, "addLeds", [rt.arrayPointerType(ledClass), rt.intTypeLiteral], rt.voidTypeLiteral)

                        rt.regFunc(() => {

                            const data = ledList.v.target

                            const leds: string[][] = []
                            let index = 0
                            for (let rowI = 0; rowI < 8; rowI++) {
                                const row = [];
                                leds.push(row)

                                for (let colI = 0; colI < 8; colI++) {
                                    const element = data[index]
                                    const colorMember = rt.getMember(element, "color")

                                    if (colorMember.v == "colorinit") {
                                        row.push("transparent")
                                    } else {
                                        const colorString = rt.getStringFromCharArray(colorMember.v)
                                        row.push(colorString)
                                    }

                                    index++
                                }
                            }


                            environment.setLedMatrix(leds)
                        }, staticT, "show", [], rt.voidTypeLiteral)

                        rt.defVar("FastLED", staticT, instantiate(rt, staticT))
                        /* rt.registerTypedef({
                             Red: "red",
                             Black: "Black"
                         }, "CRGB")*/
                        //TODO
                    }
                },
                "mainloop": {
                    load: (rt) => {
                        rt.regFunc((rt, _this, setupFnc, loopFnc) => {

                            consumeFunction(rt, setupFnc)

                            this.intervals.push(setInterval(() => {
                                consumeFunction(rt, loopFnc)
                            }, 1000))


                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "looptrigger", [rt.functionType(rt.voidTypeLiteral, []), rt.functionType(rt.voidTypeLiteral, [])], rt.voidTypeLiteral);

                        rt.regFunc(function (rt, _this, setupFnc, loopFnc) {
                            const debugStr = rt.getStringFromCharArray(setupFnc)
                            console.log(debugStr)
                            return rt.val(rt.voidTypeLiteral, undefined);
                        }, "global", "debug", [rt.arrayPointerType(rt.charTypeLiteral)], rt.voidTypeLiteral);
                    }
                }
            },
            stdio: {
                write: function (s) {
                    output += s;
                    debugger
                }
            },
            //debug: true
        })
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
    override update(newcode: string): void {

    }

    override kill(): void {
        super.kill()

        this.intervals.forEach(i => clearInterval(i))
        this.intervals = []
    }
}