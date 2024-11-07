import { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { Current } from './units/current';
import { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import { Wiring, type GetImpedanceContext, type ProcessCurrentOptions, type ProcessCurrentReturn } from './wiring.a';

export class NotGate extends Wiring {

    static readonly typeName = "NotGate"

    vcc = new Connection(this, "not_vcc");
    gnd = new Connection(this, "not_gnd");


    in = new Connection(this, "not_in")
    inverted_out = new Connection(this, "not_out")

    enabled = true

    vccToInvOutImpedance = new Impedance(10)
    voltageDropV: Voltage;
    private readonly inToGndImpedance = new Impedance(10000);
    voltageDropIn: Voltage;

    override getImpedance(opts: GetImpedanceContext): Impedance {
        if (opts.from === this.vcc) {
            if (this.enabled) {
                return this.vccToInvOutImpedance
            }
            return Impedance.BLOCKED
        }
        return this.inToGndImpedance
    }
    override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {

        if (options.fromConnection === this.in) {
            let enabled = this.enabled
            if (options.current.isPositive()) {
                this.enabled = false
            } else {
                this.enabled = true
            }
            if (enabled !== this.enabled) {
                this.solver.invalidate()
            }
            this.voltageDropIn = Voltage.fromCurrent(options.current, this.inToGndImpedance)
            return {
                ...options,
                current: Current.ZERO(),
                voltage: options.voltage.dropped(this.voltageDropIn)
            }
        } else if (options.fromConnection === this.vcc) {
            this.voltageDropV = Voltage.fromCurrent(options.current, this.vccToInvOutImpedance)
            if (this.enabled) {


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
        }


        return options
    }
    override register(options: RegisterOptions): void {

        if (options.from === this.gnd || options.from === this.inverted_out) {
            return
        }

        const instance: REgistrationNode = {
            name: NotGate.typeName
        }
        if (options.forCalculation) {
            instance.node = this
            instance.connection = options.from
        }

        options.nodes.push(instance)

        if (options.from == this.vcc) {

            options.next(this.inverted_out, { ...options, from: this })
        } else if (options.from == this.in) {
            options.next(this.gnd, { ...options, from: this })
        }
    }



}