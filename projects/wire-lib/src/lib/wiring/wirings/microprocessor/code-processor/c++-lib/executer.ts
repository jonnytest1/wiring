import { env } from 'process';
import type { MicroProcessorBase } from '../../microprocessor-base';
import { Executer } from '../executer';
import "./lib/JSCPP.js"
import type { Esp32 } from '../../esp32';



type Member<T extends TypeValue<TypeArg>> = {
    name: string;
    initialize: (rt: Runtime, _this: TypeValue<TypeArg>) => T;
};

type CharTypeLiteral = {
    type: "primitive",
    name: "char"
}
type VoidTypeLiteral = {
    type: "primitive",
    name: "void"
}

type IntTypeLiteral = { type: 'primitive', name: 'int' }




type ClassTypeLiteral<T extends string, M extends ReadonlyArray<Member<TypeValue<TypeArg>>>> = {
    name: T,
    type: "class"
    cConstructor(rt: Runtime, _this, args)

}


type ClassRef<T extends string> = {
    name: T,
    type: "class"
}
type TypeArg = CharTypeLiteral | VoidTypeLiteral | IntTypeLiteral | ClassTypeLiteral<string, []> | ArrayTypeLiteral<TypeArg> | ClassRef<string> | FunctionTypeLiteral<TypeArg, Array<TypeArg>>

interface ArrayTypeLiteral<T extends TypeArg> {
    type: "pointer",
    eleType: T
}

interface FunctionTypeLiteral<RetType extends TypeArg, Sig extends Array<TypeArg>> {
    type: "function",
    retType: RetType,
    signature: Sig
}



type TypeValue<T extends TypeArg> = {
    t: T,
    v: TypeArgValue<T>,
    args?: Array<TypeValue<TypeArg>>
}

type StringTypeLiteral = ArrayTypeLiteral<CharTypeLiteral>


type TypeArgValue<T extends TypeArg> = T extends ArrayTypeLiteral<infer S> ? { target: Array<TypeValue<S>> } :
    // Array<TypeArgValue<S[number]>>
    T extends FunctionTypeLiteral<infer R, infer S> ? { target: (rt: Runtime, self: {}, args: []) => IterableIterator<unknown> } :
    T extends CharTypeLiteral ? number
    : never




type ClassMemberObject<T extends ClassTypeLiteral<string, Array<Member<TypeValue<TypeArg>>>>> = T extends ClassTypeLiteral<string, infer M> ? {
    [K in M[number]as `${K["name"]}`]: ReturnType<K["initialize"]>
} : never


type Runtime = {
    getMember<T extends ClassTypeLiteral<string, M>, M extends Array<Member<TypeValue<TypeArg>>>, K extends keyof ClassMemberObject<T>>(other: TypeValue<T>, arg1: K): { v: ClassMemberObject<T>[K] }
    makeOperatorFuncName(arg0: string): string;
    makeCharArrayFromString(arg0: string): TypeValue<ArrayTypeLiteral<CharTypeLiteral>>;
    getTypeSignature(staticT: TypeArg): string;
    types: Record<string, TypeArg>;
    defVar(name: string, varType: TypeArg, init: TypeValue<TypeArg>): unknown;
    newClass<N extends string, T extends ReadonlyArray<Member<TypeValue<TypeArg>>>>(name: N, members: T, preinit?: (rt: Runtime, args: Array<TypeValue<TypeArg>>) => void): ClassTypeLiteral<N, T>;
    getStringFromCharArray(of: TypeValue<StringTypeLiteral>): string;
    arrayPointerType<T extends TypeArg>(ofType: T): ArrayTypeLiteral<T>;
    getCompatibleFunc(scope: string, name: string, args: undefined[]): (rt: Runtime, thisObj, args) => any;
    charTypeLiteral: CharTypeLiteral;
    registerTypedef: (def, name: string) => void;


    val: <T extends TypeArg>(returnType: T, value) => TypeValue<T>
    intTypeLiteral: IntTypeLiteral
    voidTypeLiteral: VoidTypeLiteral
    functionType: <R extends TypeArg, A extends Array<TypeArg>>(retType: R, args: Array<TypeArg>) => FunctionTypeLiteral<R, A>



    regFunc<T1 extends TypeArg, T2 extends TypeArg>(
        fnc: (runtime: Runtime, self: any, t1: TypeValue<T1>, t2: TypeValue<T2>) => void,
        scope: "global" | TypeArg,
        name: string,
        args: [T1, T2],
        returnType: TypeArg
    ): void
    regFunc<T1 extends TypeArg>(
        fnc: (runtime: Runtime, self: any, t1: TypeValue<T1>) => void,
        scope: "global" | TypeArg,
        name: string,
        args: [T1],
        returnType: TypeArg
    ): void
    regFunc(
        fnc: (runtime: Runtime, self: any) => void,
        scope: "global" | TypeArg,
        name: string,
        args: [],
        returnType: TypeArg
    ): void
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

        function consumeFunction<Fnc extends TypeValue<FunctionTypeLiteral<TypeArg, Array<TypeArg>>>>(rt: Runtime, fnc: Fnc, args: Array<TypeValue<TypeArg>> = []) {
            const ret = []

            for (const val of fnc.v.target(rt, {}, [])) {
                ret.push(val)
            }
            return ret
        }


        function instantiate<C extends ClassTypeLiteral<string, []>>(rt: Runtime, typeArg: C, args: Array<TypeValue<TypeArg>> = []): TypeValue<ClassRef<C["name"]>> {
            const classType = rt.types[rt.getTypeSignature(typeArg)] as ClassTypeLiteral<string, []>
            const _this = {
                v: {},
                t: typeArg,
                args
            }
            classType.cConstructor(rt, _this, args)
            debugger
            return _this as unknown as TypeValue<ClassRef<C["name"]>>
        }
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
                        const ledClass = rt.newClass("CRGB", [
                            {
                                name: "color" as const,
                                initialize(rt, _this) {
                                    if (_this.args?.[0]) {
                                        return _this.args?.[0] as TypeValue<StringTypeLiteral>
                                    }
                                    return rt.val(rt.arrayPointerType(rt.charTypeLiteral), null)
                                },
                            }
                        ])
                        rt.regFunc((rt, self, other) => {
                            const color = rt.getMember(other.v, "color")
                            self.v.members.color.v = color

                        }, ledClass, rt.makeOperatorFuncName("="), [ledClass], rt.voidTypeLiteral)


                        const staticT = rt.newClass("CRGBStatic", [{
                            name: "Red" as const,
                            initialize<T>(rt: Runtime, _this) {
                                return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("red")]))
                            },
                        }, {
                            name: "Black" as const,
                            initialize(rt, _this) {
                                return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("black")]))
                            },
                        }])
                        let ledList: TypeValue<ArrayTypeLiteral<typeof ledClass>>
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

                                    if (colorMember.v == null) {
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

                        const instance = instantiate(rt, staticT);

                        rt.defVar("FastLED", staticT, instance)
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

                        rt.regFunc(function (rt, _this, debugParam) {
                            const debugStr = rt.getStringFromCharArray(debugParam)
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
        this.code = newcode

        if (this.running) {
            this.kill()
            this.start()
        }
    }

    override kill(): void {
        super.kill()

        this.intervals.forEach(i => clearInterval(i))
        this.intervals = []
    }
}
