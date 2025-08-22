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
    voltageDropBIn: Voltage;

    currentAIn: Current;
    currentBIn: Current;

    history: Array<{ a: Voltage, b: Voltage, aC: Current, bC: Current }> = []

    private readonly inToGndImpedance = new Impedance(10000);

    isEnabled() {
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
                this.enabledA = true
            } else {
                this.enabledA = false
            }

            if (enabled !== this.isEnabled()) {
                this.solver?.invalidate()
            }
            this.currentAIn = options.current
            this.voltageDropAIn = Voltage.fromCurrent(options.current, this.inToGndImpedance)
            this.history.push({ a: this.voltageDropAIn, b: this.voltageDropBIn, aC: this.currentAIn, bC: this.currentBIn })
            return {
                ...options,
                current: Current.ZERO(),
                voltageDrop: options.voltageDrop.dropped(this.voltageDropAIn)
            }
        } else if (options.fromConnection === this.inB) {
            if (options.current.isPositive()) {
                this.enabledB = true
            } else {
                this.enabledB = false
            }

            if (enabled !== this.isEnabled()) {
                this.solver?.invalidate()
            }
            this.currentBIn = options.current
            this.voltageDropBIn = options.voltageDrop
            this.history.push({ a: this.voltageDropAIn, b: this.voltageDropBIn, aC: this.currentAIn, bC: this.currentBIn })
            return { ...options, current: Current.ZERO() }

        } else if (options.fromConnection === this.vcc) {

            this.voltageDropV = Voltage.fromCurrent(options.current, this.inToGndImpedance)
            if (this.isEnabled()) {

                return {
                    ...options,
                    voltageDrop: options.voltageDrop.dropped(this.voltageDropV)
                }
            } else {
                return {
                    ...options,
                    voltageDrop: options.voltageDrop.dropped(this.voltageDropV),
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