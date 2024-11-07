import { Collection } from './collection';
import { Connection } from './connection';
import { EULER } from './constant';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { noConnection, noResistance } from './resistance-return';
import { Capacitance } from './units/capacitance';
import { Charge } from './units/charge';
import { Current } from './units/current';
import { Impedance } from './units/impedance';
import { Time } from './units/time';
import { Voltage } from './units/voltage';
import { type GetResistanceOptions, type ResistanceReturn, type CurrentCurrent, type CurrentOption, defaultGetResistanceOpts, Wiring, type GetImpedanceContext, type ProcessCurrentOptions, type ProcessCurrentReturn } from './wiring.a';

export class Capacitor extends Wiring {

    static readonly typeName = "Capacitor"

    // the capacitor acts as an open circuit once it is fully charged.


    /**
     * charge in coulomb
     */
    charge: Charge = new Charge(0)
    voltageDrop: Voltage
    supplyVoltage: Voltage;
    capacitance: Capacitance;
    maxVoltage: Voltage;

    lastCurrent: Current;

    private readonly defaultREsistance = new Impedance(0.001);
    reverseResistanceCheckTime: number;
    outC: Connection;
    inC: Connection;

    /**
     * 
     * @param capacitanceMikro in uF
     * @param maxVoltage in V
     */
    constructor(capacitance: number, maxVoltage: number) {
        super()
        this.outC = new Connection(this, 'cap_negative');
        this.inC = new Connection(this, 'cap_positive');

        this.capacitance = Capacitance.fromMicro(capacitance)

        this.maxVoltage = new Voltage(maxVoltage)

    }

    getTimeConstant(resistance = this.defaultREsistance) {
        return Time.timeConstant(resistance, this.capacitance)
    }


    getVoltage() {
        return Voltage.fromCharge(this.charge, this.capacitance)
    }

    override providedVoltage(): Voltage {
        return this.getVoltage()
    }

    getMaxCharge(supplyVoltage: Voltage) {
        return Charge.fromVoltage(supplyVoltage, this.capacitance)
    }

    override register(options: RegisterOptions) {
        if (options.from == this.outC) {
            return
        }
        const instance: REgistrationNode = { name: Capacitor.typeName };
        if (options.forCalculation) {
            instance.node = this
            instance.connection = options.from
        }
        options.nodes.push(instance);

        if (options.from == null) {
            // reflow calculation
            options.next(this.inC!, { ...options, from: this })

        } else {
            options.next(this.outC, { ...options, from: this })
        }


    }


    override getImpedance(opts: GetImpedanceContext): Impedance {
        //if (opts.checkTime === this.reverseResistanceCheckTime) {
        //    return noConnection(this)
        //}

        if (this.getVoltage() >= this.supplyVoltage) {
            return new Impedance(NaN)
        }

        if (this.charge.isZero()) {
            return this.defaultREsistance
        }
        const impedance = Impedance.fromVoltages(this.maxVoltage, this.getVoltage())

        console.log(impedance.impedance)
        return impedance

    }
    override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {

        const currentVoltage = this.getVoltage();
        if (options.fromConnection === null) {
            const current = Current.fromVoltage(currentVoltage, options.totalImpedance)

            try {
                return {
                    ...options,
                    voltage: options.voltage.with(currentVoltage),
                    supplyVoltage: options.supplyVoltage.with(currentVoltage),
                    current: current
                }
            } finally {
                const processedCharge = Charge.from(current, options.deltaTime);
                this.charge.process(processedCharge)
            }

        }

        this.supplyVoltage = options.supplyVoltage
        this.lastCurrent = options.current

        if (currentVoltage.dropped(options.voltage).isPositive()) {

            options.postProcess(() => {
                // const subSolver = this.solver.from(this, currentVoltage)
                // subSolver.check(options.deltaTime)
                //debugger
            })
            //this.reverseResistanceCheckTime = options.triggerTimestamp




            /*const resistance = this.inC.getTotalResistance(this, {
                ...defaultGetResistanceOpts(),
                checkTime: options.triggerTimestamp
            })
            const current = voltage / resistance.resistance*/
            /*this.inC.pushCurrent({
                voltage: voltage,
                current: current,
                deltaSeconds: options.deltaSeconds,
                resistance: 0,
                triggerTimestamp: options.triggerTimestamp,
            }, this)*/
        }

        if (currentVoltage < this.supplyVoltage) {
            //q = Vs(1 - e ^ (-t / RC)) * c
            const rc = this.getTimeConstant(options.totalImpedance).seconds;



            const exponent = Math.pow(EULER, (-options.deltaTime.seconds) / rc);

            const maxCharge = this.getMaxCharge(options.supplyVoltage)

            const chargeOffset = (this.charge.coulomb - maxCharge.coulomb) * exponent;
            const chargeDiff = maxCharge.coulomb + chargeOffset - this.charge.coulomb

            this.charge.add(new Charge(chargeDiff))

            return {
                ...options,
                current: Current.ZERO(),
                voltage: options.voltage
            }
        }



    }


}