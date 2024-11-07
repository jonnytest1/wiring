import { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { Current } from './units/current';
import { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import { Wiring, type GetImpedanceContext, type ProcessCurrentOptions, type ProcessCurrentReturn } from './wiring.a';

export class OrGate extends Wiring {

    static readonly typeName = "OrGate"

    vcc = new Connection(this, "or_vcc");
    gnd = new Connection(this, "or_gnd");


    inA = new Connection(this, "or_inA")
    inB = new Connection(this, "or_inB")

    out = new Connection(this, "not_out")

    enabledA = false
    enabledB = false


    vccToOutResistance = new Impedance(10)
    voltageDropV: Voltage;
    voltageDropAIn: Voltage;

    private readonly inToGndImpedance = new Impedance(10000);

    private isEnabled() {
        return this.enabledA || this.enabledB
    }
    override getImpedance(opts: GetImpedanceContext): Impedance {
        if (opts.from === this.vcc) {
            if (this.isEnabled()) {
                return this.vccToOutResistance
            }
            return Impedance.BLOCKED
        }
        return this.inToGndImpedance
    }
    override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
        let enabled = this.isEnabled()
        if (options.fromConnection === this.inA) {
            if (options.current.isPositive()) {
                this.enabledA = false
            } else {
                this.enabledA = true
            }

            if (enabled !== this.isEnabled()) {
                this.solver.invalidate()
            }
            this.voltageDropAIn = Voltage.fromCurrent(options.current, this.inToGndImpedance)
            return {
                ...options,
                current: Current.ZERO(),
                voltage: options.voltage.dropped(this.voltageDropAIn)
            }
        } else if (options.fromConnection === this.inB) {
            if (options.current.isPositive()) {
                this.enabledB = false
            } else {
                this.enabledB = true
            }

            if (enabled !== this.isEnabled()) {
                this.solver.invalidate()
            }
            return { ...options, current: Current.ZERO() }

        } else if (options.fromConnection === this.vcc) {

            this.voltageDropV = Voltage.fromCurrent(options.current, this.inToGndImpedance)
            if (this.isEnabled()) {

                return {
                    ...options,
                    voltage: options.voltage.dropped(this.voltageDropV)
                }
            } else {
                return {
                    ...options,
                    voltage: options.voltage.dropped(this.voltageDropV),
                    current: Current.ZERO()
                }
            }
        } else {
            debugger;
        }
    }
    override register(options: RegisterOptions): void {

        if (options.from === this.gnd || options.from === this.out) {
            return
        }

        const instance: REgistrationNode = {
            name: OrGate.typeName
        }
        if (options.forCalculation) {
            instance.node = this
            instance.connection = options.from
        }

        options.nodes.push(instance)




        if (options.from == this.vcc) {

            options.next(this.out, { ...options, from: this })
        } else if (options.from == this.inA) {
            options.next(this.gnd, { ...options, from: this })
        } else if (options.from == this.inB) {
            options.next(this.gnd, { ...options, from: this })
        }
    }



}