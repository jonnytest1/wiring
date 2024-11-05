
import type { Current } from './current';
import type { Time } from './time';

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
    isZero() {
        return this._coulomb == 0
    }

    static from(current: Current, time: Time) {
        return new Charge(current.current * time.seconds)
    }

}