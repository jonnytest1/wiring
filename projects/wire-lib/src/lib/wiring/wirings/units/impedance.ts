import { sum } from '../../util/array';
import { solver } from '../../util/solver';
import type { Current } from './current';
import type { Voltage } from './voltage';

export class Impedance {


    static readonly ZERO = new Impedance(0);
    static readonly BASICALLY_NOTHING = new Impedance(0.0001);
    static readonly BLOCKED = new Impedance(Infinity);
    // in Ohm

    constructor(public readonly impedance: number) {

    }

    isPositive() {
        return this.impedance > 0
    }
    chain(other: Impedance) {
        return new Impedance(this.impedance + other.impedance)
    }

    percentOf(total: Impedance): number {
        return this.impedance / total.impedance
    }

    isFinite() {
        return isFinite(this.impedance)
    }


    static parrallel(others: Array<Impedance>): Impedance {


        const impedanceCalc = others.map(imp => `(1 / ${imp.impedance})`).join("+")

        // using solver to get around some division precision errors
        const result = solver(`1 / (${impedanceCalc})`)

        return new Impedance(+result.valueOf())
    }


    static combine(arg0: Impedance[]) {
        return new Impedance(sum(arg0.map(a => a.impedance)))
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