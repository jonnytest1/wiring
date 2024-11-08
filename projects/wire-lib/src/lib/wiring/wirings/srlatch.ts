import { nor } from './nor';
import { Wire } from './wire';

export function SRLatch() {


    const reset = nor()
    const set = nor()

    reset.ground.connectWire(set.ground)
    reset.vcc.connectWire(set.vcc)


    const qInv = Wire.connect(reset.inputB, set.output)

    const q = Wire.connect(reset.output, set.inputA)
    return {
        vcc: reset.vcc,
        ground: reset.ground,

        set: set.inputB,
        reset: reset.inputA,
        qInv,
        q,
        _debug: {
            reset,
            set,
            qEnabled: reset._debug.notGate,
            qInvEnabled: set._debug.notGate
        }
    }


}


export type SRLatch = ReturnType<typeof SRLatch>