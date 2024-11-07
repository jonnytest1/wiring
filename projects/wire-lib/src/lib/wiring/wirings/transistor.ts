import { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { Current } from './units/current';
import { Impedance } from './units/impedance';
import { Wiring, type GetImpedanceContext, type ProcessCurrentOptions, type ProcessCurrentReturn } from './wiring.a';

export class Transistor extends Wiring {

    static typeName = "Transistor"

    /**
     * big current in
     */
    collector = new Connection(this, "tr_col")
    /**
     *trigger 
     */
    base = new Connection(this, "tr_base")
    /**
     *out 
     */
    emitter = new Connection(this, "tr_emit")


    open = false






    override getImpedance(opts: GetImpedanceContext): Impedance {
        if (opts.from === this.base) {
            return Impedance.BASICALLY_NOTHING
        }
        if (this.open) {
            return Impedance.BASICALLY_NOTHING
        }
        return Impedance.BLOCKED
    }
    override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
        if (options.fromConnection === this.base) {
            let prevOpen = this.open
            this.open = options.current.isPositive()

            if (prevOpen !== this.open) {
                this.solver.recalculate()
            }
            return options
        } else if (options.fromConnection === this.collector) {
            if (this.open) {
                return options
            }
            return {
                ...options,
                current: Current.ZERO()
            }
        }
        debugger
        throw new Error('Method not implemented.');
    }
    override register(options: RegisterOptions): void {
        if (options.from === this.emitter) {
            return
        }
        const instnace: REgistrationNode = {
            name: Transistor.typeName
        }
        if (options.forCalculation) {
            instnace.node = this
            instnace.connection = options.from
        }
        options.nodes.push(instnace)

        options.next(this.emitter, { ...options, from: this })
    }

}