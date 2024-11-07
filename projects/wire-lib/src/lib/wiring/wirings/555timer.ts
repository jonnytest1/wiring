import { Comparator } from './comparator';
import { Connection } from './connection';
import { Resistor } from './resistor';
import { SRLatch } from './srlatch';
import { Transistor } from './transistor';
import { Wire } from './wire';

export class Timer555Plan {


    // public vcc: Connection
    //public ground: Connection = new Connection(this, "Timer555_gnd")
    discharge: Connection

    threshhold: Connection
    trigger: Connection;

    output: Wire

    vcc: Wire

    ground: Wire


    debugRefs: {
        comparator33: Comparator;
        comparator16: Comparator;
        resistor1: Resistor;
        resistor2: Resistor;
        resistor3: Resistor;
    }


    constructor() {
        // https://www.youtube.com/watch?v=kRlSFm519Bo&list=PLowKtXNTBypGqImE405J2565dvjafglHU&index=2&t=535s

        const srLatch = SRLatch()

        this.output = srLatch.q

        const dischargeTransistor = new Transistor()
        this.discharge = dischargeTransistor.collector

        Wire.connect(dischargeTransistor.base).connectWire(srLatch.qInv);

        const comparator33 = new Comparator()
        const comparator16 = new Comparator()
        this.threshhold = comparator33.positive
        this.trigger = comparator16.negative

        Wire.connect(comparator33.vOut, srLatch.reset);
        Wire.connect(comparator16.vOut, srLatch.set);
        // voltage divider
        const resistor1 = new Resistor(5)
        const resistor2 = new Resistor(5)
        const resistor3 = new Resistor(5)
        const divider1Wire = Wire.connect(resistor1.outC!, resistor2.inC!, comparator33.negative);
        const divider2Wire = Wire.connect(resistor2.outC!, comparator16.positive, resistor3.inC!);


        this.vcc = Wire.connect(resistor1.inC!, comparator33.vcc, comparator16.vcc).connectWire(srLatch.vcc)

        this.ground = Wire.connect(resistor3.outC!, comparator33.ground, comparator16.ground!, dischargeTransistor.emitter).connectWire(srLatch.ground)


        this.debugRefs = {
            comparator33,
            comparator16,
            resistor1,
            resistor2,
            resistor3
        }
    }
}