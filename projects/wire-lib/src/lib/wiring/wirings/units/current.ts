import type { REgistrationNode } from '../interfaces/registration';
import type { Impedance } from './impedance';
import type { Voltage } from './voltage';

export class Current {


    // in Ampere

    constructor(public readonly current: number) {

    }


    join(other: Current) {
        return new Current(this.current + other.current)
    }


    isPositive() {
        return this.current > 0
    }


    milliAmpere() {
        return this.current * 1000
    }

    static fromVoltage(voltage: Voltage, impedance: Impedance) {
        return new Current(voltage.voltage / impedance.impedance)
    }
    static ZERO() {
        return new Current(0)
    }

}