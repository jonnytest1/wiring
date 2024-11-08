import type { Capacitance } from './capacitance';
import type { Current } from './current';
import type { Impedance } from './impedance';

export class Time {
    // in seconds

    constructor(private _seconds: number) {

    }

    get seconds() {
        return this._seconds
    }

    copy() {
        return new Time(this.seconds)
    }

    static timeConstant(impedance: Impedance, capacitance: Capacitance) {
        return new Time(impedance.impedance * capacitance.farad)
    }

    difference(other: Time) {
        return this.seconds - other.seconds
    }


    ago(other: Time) {
        return new Time(this.difference(other))
    }

    dividedStep(divider: number) {
        return new Time(this._seconds / divider)
    }

    step(deltaTime: Time) {
        this._seconds += deltaTime._seconds
    }
}