import type { Esp32 } from '../../../esp32';
import { instantiate, newClassBound, type ArrayTypeLiteral, type Runtime, type StringTypeLiteral, type TypeValue } from '../jscpp';

export function fastLed(env: Esp32) {
    return {
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
                }, {
                    name: "Green" as const,
                    initialize(rt, _this) {
                        return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("green")]));
                    },
                }, {
                    name: "Orange" as const,
                    initialize(rt, _this) {
                        return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("orange")]));
                    },
                }, {
                    name: "Brown" as const,
                    initialize(rt, _this) {
                        return rt.val(ledClass, instantiate(rt, ledClass, [rt.makeCharArrayFromString("brown")]));
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


                    env.setLedMatrix(leds);
                }, staticT, "show", [], rt.voidTypeLiteral);


                rt.regFunc(() => {

                }, staticT, "setBrightness", [rt.intTypeLiteral], rt.voidTypeLiteral);


                const instance = instantiate(rt, staticT, []);

                rt.defVar("FastLED", staticT, instance);
                rt.defVar("CRGBStatic", staticT, instance);

            }
        }
    }
}