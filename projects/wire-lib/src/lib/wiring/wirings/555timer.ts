import { Comparator } from './comparator';
import { Connection } from './connection';
import type { RegisterOptions } from './interfaces/registration';
import { Resistor } from './resistor';
import type { Impedance } from './units/impedance';
import { Wire } from './wire';
import { Wiring, type GetImpedanceContext, type ProcessCurrentOptions, type ProcessCurrentReturn } from './wiring.a';

export class Timer555Plan {


    // public vcc: Connection
    //public ground: Connection = new Connection(this, "Timer555_gnd")
    discharge: Connection

    threshhold: Connection
    trigger: Connection;

    output: Connection

    vcc: Wire

    ground: Wire

    constructor() {
        // https://www.youtube.com/watch?v=kRlSFm519Bo&list=PLowKtXNTBypGqImE405J2565dvjafglHU&index=2&t=535s


        let srLAtchReset: Connection;
        let srLAtchSet: Connection;
        //exposed
        let srLAtchQ: Connection;
        let srLAtchNotQ: Connection;


        const comparator33 = new Comparator()
        const comparator16 = new Comparator()
        this.threshhold = comparator33.positive
        this.trigger = comparator16.negative

        Wire.connect(comparator33.vOut, srLAtchReset);
        Wire.connect(comparator16.vOut, srLAtchSet);
        // voltage divider
        const resistor1 = new Resistor(5)
        const resistor2 = new Resistor(5)
        const resistor3 = new Resistor(5)
        const divider1Wire = Wire.connect(resistor1.outC!, resistor2.inC!, comparator33.negative);
        const divider2Wire = Wire.connect(resistor2.outC!, comparator16.positive, resistor3.inC!);


        this.vcc = Wire.connect(resistor1.inC!, comparator33.vcc, comparator16.vcc)

        this.ground = Wire.connect(resistor3.outC!, comparator33.ground, comparator16.ground!)
    }
}