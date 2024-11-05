import { Collection } from './collection';
import { Connection } from './connection';
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

    static override typeName = "Capacitor"

    // the capacitor acts as an open circuit once it is fully charged.


    /**
     * charge in coulomb
     */
    charge: Charge = new Charge(0)
    voltageDrop = 0
    supplyVoltage: Voltage;
    capacitance: Capacitance;
    maxVoltage: Voltage;

    lastCurrent: Current;

    private readonly defaultREsistance = new Impedance(0.001);
    reverseResistanceCheckTime: number;

    /**
     * 
     * @param capacitanceMikro in uF
     * @param maxVoltage in V
     */
    constructor(capacitance: number, maxVoltage: number) {
        super(null, null);
        this.outC = new Connection(this, 'cap_negative');
        this.inC = new Connection(this, 'cap_positive');

        this.capacitance = Capacitance.fromMicro(capacitance)

        this.maxVoltage = new Voltage(maxVoltage)

    }

    getTimeConstant(resistance = this.defaultREsistance) {
        return Time.timeConstant(this.defaultREsistance, this.capacitance)
    }


    getVoltage() {
        return Voltage.fromCharge(this.charge, this.capacitance)
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
        return this.outC?.register({ ...options, from: this });
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
        throw new Error('Method not implemented.');
    }
    /*  override getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn {
          if (options.checkTime === this.reverseResistanceCheckTime) {
              return noConnection(this)
          }
  
          if (this.getVoltage() >= this.supplyVoltage) {
              return noConnection(this)
          }
  
          const w = 0
          const j = 0
  
          if (this.charge.isZero()) {
              return {
                  resistance: this.defaultREsistance,
                  steps: [this],
                  afterBlock: []
              }
          }
          const impedance = Impedance.fromVoltages(this.maxVoltage, this.getVoltage())
  
          console.log(impedance.impedance)
          return {
              resistance: impedance.impedance,
              afterBlock: [],
              steps: [this]
          }
  
  
      }
  */

    override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        this.supplyVoltage = new Voltage(options.voltage)
        this.lastCurrent = new Current(options.current)
        if (this.getVoltage() < this.supplyVoltage) {

            this.charge.add(Charge.from(new Current(options.current), new Time(options.deltaSeconds)))


            return this.outC.pushCurrent({
                ...options,
                current: 0,
                voltage: options.voltage - this.voltageDrop
            }, this)
        } else {
            const voltage = this.getVoltage().voltage;
            debugger
            this.reverseResistanceCheckTime = options.triggerTimestamp

            this.solver.from(this)


            const resistance = this.inC.getTotalResistance(this, {
                ...defaultGetResistanceOpts(),
                checkTime: options.triggerTimestamp
            })
            const current = voltage / resistance.resistance
            this.inC.pushCurrent({
                voltage: voltage,
                current: current,
                deltaSeconds: options.deltaSeconds,
                resistance: 0,
                triggerTimestamp: options.triggerTimestamp,
            }, this)

            debugger
        }

    }

}