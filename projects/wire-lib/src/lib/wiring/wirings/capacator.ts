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


    tCurrent = new Time(0)
    tDisconnect: Time | null = null
    chargeAtDisconnect: Charge

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


    isCharging() {
        return this.tDisconnect === null
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

        //console.log(impedance.impedance)
        return impedance

    }
    override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
        this.tCurrent.step(options.deltaTime)
        const currentVoltage = this.getVoltage();
        if (options.fromConnection === null) {
            const current = Current.fromVoltage(currentVoltage, options.source.totalImpedance)

            try {
                return {
                    ...options,
                    voltageDrop: options.voltageDrop.with(currentVoltage),
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

        if (currentVoltage.dropped(options.voltageDrop).isPositive()) {
            this.solver.invalidate()
        }
        if (currentVoltage < this.supplyVoltage) {
            //q = Vs(1 - e ^ (-t / RC)) * c
            const rc = this.getTimeConstant(options.source.totalImpedance).seconds;



            const exponent = Math.pow(EULER, (-options.deltaTime.seconds) / rc);

            const maxCharge = this.getMaxCharge(options.supplyVoltage)

            const chargeOffset = (this.charge.coulomb - maxCharge.coulomb) * exponent;
            const chargeDiff = maxCharge.coulomb + chargeOffset - this.charge.coulomb

            const currentADjusted = Math.min(chargeDiff, options.current.current)


            const isShortened = currentADjusted < chargeDiff;
            if (isShortened) {
                if (!this.tDisconnect) {
                    this.tDisconnect = this.tCurrent.copy()
                    this.chargeAtDisconnect = this.charge.copy()
                }
                const disconnectedSeconds = this.tCurrent.difference(this.tDisconnect);
                const exponent = Math.pow(EULER, -(disconnectedSeconds / rc));

                const newCharge = this.chargeAtDisconnect.coulomb * exponent
                const dischargeDiff = newCharge - this.charge.coulomb


                this.charge.add(new Charge(dischargeDiff))
                //debugger
            } else {
                if (this.tDisconnect) {
                    this.tDisconnect = null
                }
                this.charge.add(new Charge(currentADjusted))
            }
            return {
                ...options,

            }
        }



    }


}