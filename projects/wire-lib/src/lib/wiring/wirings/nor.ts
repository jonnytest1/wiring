import { NotGate } from './not';
import { OrGate } from './or';
import { Wire } from './wire';

export function nor() {

    const orGate = new OrGate()

    const notGate = new NotGate()

    Wire.connect(orGate.out, notGate.in)
    return {
        vcc: Wire.connect(orGate.vcc, notGate.vcc),
        ground: Wire.connect(orGate.gnd, notGate.gnd),

        inputA: orGate.inA,
        inputB: orGate.inB,
        output: notGate.inverted_out
    }


}