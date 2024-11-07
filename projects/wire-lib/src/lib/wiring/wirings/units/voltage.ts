import type { Capacitance } from './capacitance';
import type { Charge } from './charge';
import type { Current } from './current';
import type { Impedance } from './impedance';

export class Voltage {

    static ZERO = new Voltage(0);


    // in Volt

    constructor(public readonly voltage: number) {

    }
    percentOf(maxVoltage: Voltage) {
        return this.voltage / maxVoltage.voltage
    }

    valueOf() {
        return this.voltage
    }

    isPositive() {
        return this.voltage > 0
    }

    isGreaterThan(voltageBefore: Voltage | null) {
        if (!voltageBefore) {
            return false
        }
        return this.voltage > voltageBefore.voltage
    }

    with(other: Voltage) {
        return new Voltage(this.voltage + other.voltage)
    }

    fraction(percentage: number) {
        return new Voltage(this.voltage * percentage)
    }


    dropped(other: Voltage) {
        return new Voltage(this.voltage - other.voltage)
    }
    static fromCurrent(current: Current, imp: Impedance): Voltage {
        return new Voltage(current.current * imp.impedance)
    }
    static fromCharge(charge: Charge, cap: Capacitance) {
        return new Voltage(charge.coulomb / cap.farad)
    }



}   