/// <reference types="web-bluetooth" />
import { instantiate, newClassBound, newStaticClassBound, stringTypeLiteral, type JscppInclude, type Runtime, type StringTypeLiteral } from '../jscpp';

export function bleLibs(): JscppInclude {


    return {
        "BLEDevice.h": {
            load(rt) {


                const bleClientClass = newClassBound<[]>(rt)("BLEClient", []);

                rt.regFunc((rt, self, address) => {
                    const addressV = rt.getStringFromCharArray(address)

                    navigator.bluetooth.requestDevice({
                        acceptAllDevices: true
                    })

                    debugger
                }, bleClientClass, "connect", [stringTypeLiteral(rt)], rt.voidTypeLiteral)

                /*  rt.regFunc((rt, self, other) => {
                      const color = rt.getMember(other.v, "color");
                      self.v.members.color.v = color;
  
                  }, bleClientClass, rt.makeOperatorFuncName("="), [bleClientClass], rt.voidTypeLiteral);*/


                /* {
                     name: "createClient" as const,
                         initialize<T>(rt: Runtime, _this) {
                         debugger
                         return rt.val(bleClientClass, instantiate(rt, bleClientClass, []));
                     },
                 }*/
                const staticT = newStaticClassBound<[]>(rt)("BLEDevice", []);
                // function returning pointer to instance 
                rt.regFunc((rt, self) => {

                    const value = rt.val(bleClientClass, instantiate(rt, bleClientClass, []));
                    return value
                }, staticT, "createClient", [], bleClientClass)


                const bleAddressClass = newClassBound<[StringTypeLiteral]>(rt)("BLEAddress", [{
                    name: "_address" as const,
                    initialize(rt, _this) {

                        const firstARg = _this.args?.[0];
                        debugger
                        if (firstARg) {
                            return _this.args?.[0];
                        }

                        return rt.val(rt.arrayPointerType(rt.charTypeLiteral), null);
                    },
                }]);

                rt.regFunc((rt, self, other) => {


                }, bleAddressClass, rt.makeOperatorFuncName("="), [bleAddressClass], bleAddressClass);

            }
        },
        "BLEUtils.h": {
            load(runtime) {

            },
        }
    }



}