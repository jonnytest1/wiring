import type { Current } from './current';
import type { Voltage } from './voltage';

export class Impedance {
    // in Ohm

    constructor(public readonly impedance: number) {

    }


    chain(other: Impedance) {
        return new Impedance(this.impedance + other.impedance)
    }
    static parrallel(others: Array<Impedance>): Impedance {
        let impedanceInverted = 0;
        for (const imp of others) {
            impedanceInverted += 1 / imp.impedance
        }
        return new Impedance(1 / impedanceInverted)
    }
    /**
     * this is a sort of approximation i think
     */
    static fromVoltages(maxVoltage: Voltage, currentVoltage: Voltage) {

        return new Impedance(maxVoltage.valueOf() / (maxVoltage.valueOf() - currentVoltage.valueOf()))
    }
    static fromCurrent(current: Current, voltage: Voltage) {
        return new Impedance(voltage.voltage / current.current)
    }
}