import type { Charge } from './units/charge';
import type { Current } from './units/current';
import type { Time } from './units/time';
import type { Wiring } from './wiring.a';

export interface PowerSupply extends Wiring {
    get remainingCharge(): Charge

    get currentCurrent(): Current,
    getProjectedDuration(): Time

    getInfo?: () => string
}