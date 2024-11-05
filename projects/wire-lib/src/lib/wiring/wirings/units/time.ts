import type { Capacitance } from './capacitance';
import type { Current } from './current';
import type { Impedance } from './impedance';

export class Time {
    // in seconds

    constructor(public readonly seconds: number) {

    }

    static timeConstant(impedance: Impedance, capacitance: Capacitance) {
        return new Time(impedance.impedance * capacitance.farad)
    }
}