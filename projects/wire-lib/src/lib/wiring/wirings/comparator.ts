import { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { Current } from './units/current';
import { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import { Wiring, type CurrentCurrent, type CurrentOption, type GetImpedanceContext, type GetResistanceOptions, type ProcessCurrentOptions, type ProcessCurrentReturn, type ResistanceReturn } from './wiring.a';

export class Comparator extends Wiring {
    static typeName = "Comparator"
    public vcc: Connection = new Connection(this, "comparator_vcc")
    public ground: Connection = new Connection(this, "comparator_grnd")
    public vOut: Connection = new Connection(this, "comparator_vout")
    public positive: Connection = new Connection(this, "comparator_pos")
    public negative: Connection = new Connection(this, "comparator_neg")

    negativeVoltage = new Voltage(NaN)
    positiveVoltage = new Voltage(NaN)


    override getImpedance(opts: GetImpedanceContext): Impedance {
        if (opts.from === this.negative) {
            return new Impedance(Infinity)
        } else if (opts.from === this.positive) {
            return new Impedance(Infinity)
        }
        return new Impedance(0)
    }
    override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
        if (options.fromConnection === this.negative) {
            this.negativeVoltage = options.voltage
            return options
        } else if (options.fromConnection === this.positive) {
            this.positiveVoltage = options.voltage
            return options
        } else if (options.fromConnection === this.vcc) {
            if (!this.negativeVoltage.dropped(this.positiveVoltage).isPositive()) {
                return {
                    ...options,
                    current: new Current(0)
                }
            } else {
                return options
            }
        }
        throw new Error('Method not implemented.');
    }
    override register(options: RegisterOptions): void {
        if (options.from === this.ground) {
            return
        }


        const instance: REgistrationNode = {
            name: Comparator.typeName
        }
        if (options.forCalculation) {
            instance.node = this
            instance.connection = options.from
        }

        options.nodes.push(instance)

        if (options.from == this.vcc) {
            this.vOut.register({ ...options, from: this })
        } else {
            this.ground.register({ ...options, from: this })
        }




    }



}