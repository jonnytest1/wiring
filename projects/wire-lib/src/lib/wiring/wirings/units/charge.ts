
import type { Capacitance } from './capacitance';
import type { Current } from './current';
import type { Time } from './time';
import type { Voltage } from './voltage';

export class Charge {


    // in Coulomb
    // current * time
    // ampereSeconds

    constructor(private _coulomb: number) {

    }

    get coulomb() {
        return this._coulomb
    }


    add(other: Charge) {
        this._coulomb += other.coulomb
    }

    process(processedCharge: Charge) {
        this._coulomb = Math.max(this._coulomb - processedCharge.coulomb, 0)
    }
    copy() {
        return new Charge(this.coulomb)
    }
    isZero() {
        return this._coulomb == 0
    }
    isFinite() {
        return isFinite(this.coulomb)
    }

    static from(current: Current, time: Time) {
        return new Charge(current.current * time.seconds)
    }

    // V=Q/C => Q=V*C
    static fromVoltage(voltage: Voltage, capacitance: Capacitance) {
        return new Charge(voltage.voltage * capacitance.farad)
    }

}