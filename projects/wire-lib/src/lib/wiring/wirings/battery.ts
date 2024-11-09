import { Collection } from './collection';
import { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';

import type { ProcessCurrentOptions, ProcessCurrentReturn } from './wiring.a';
import { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import { Current } from './units/current';
import { Charge } from './units/charge';
import { Time } from './units/time';
import type { SerialiseOptinos } from '../wiring-serialisation.ts/serialisation-factory';

export class Battery extends Collection {



  static override typeName = "Battery"

  constructor(public voltage: number | null, ampereHours: number) {
    super(null, null);
    this.outC = new Connection(this, 'bat_prov');
    this.inC = new Connection(this, 'bat_cons');
    this.remainingCharge = new Charge(ampereHours * 60 * 60);
    this.maxCharge = this.remainingCharge.copy();

    // this.controlContainer = new SerialConnected()

    // Wire.connect(this.controlContainer.outC, this.inC)
  }


  remainingCharge: Charge;

  networkResistance = Impedance.ZERO;

  iterationTime: number;

  currentCurrent: Current;


  maxCharge: Charge;

  enabled = false;


  override providedVoltage(): Voltage {
    if (!this.enabled) {
      return Voltage.ZERO;
    }


    return new Voltage(this.voltage);
  }
  override getImpedance(): Impedance {
    return new Impedance(0)
  }
  override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
    if (this.enabled) {

      this.networkResistance = options.source.totalImpedance

    } else {
      console.warn("battery not enabled")
      this.networkResistance = new Impedance(NaN);
    }
    if (isNaN(this.networkResistance.impedance) || this.remainingCharge.coulomb == 0) {
      return options
    }

    const batteryVoltage = new Voltage(this.voltage);
    this.currentCurrent = options.data.getCurrent(this)

    try {
      return {
        ...options,
        supplyVoltage: options.supplyVoltage.with(batteryVoltage),
        //current: current
      }
    } finally {
      const processedCharge = Charge.from(this.currentCurrent, options.deltaTime);
      this.remainingCharge.process(processedCharge)
    }
  }

  getChargePercentage() {
    return this.remainingCharge.coulomb / this.maxCharge.coulomb
  }



  public getProjectedDuration(): Time {
    return Time.fromDischargeRate(this.remainingCharge, this.currentCurrent ?? Current.ZERO())
  }


  override register(options: RegisterOptions) {
    const instanceNode: REgistrationNode = { name: "Battery" };
    if (options.forCalculation) {
      instanceNode.node = this
      instanceNode.connection = options.from
    }

    if (options.from == this.inC) {
      options.nodes.push(instanceNode);
      return;
    }
    if (options.withSerialise) {
      instanceNode.details = {
        enabled: this.enabled,
        voltage: this.voltage,
        ui: this.uiNode,
        chargePercent: this.remainingCharge.isFinite() ? this.getChargePercentage() : "Infinity",
        maxAmpere: this.maxCharge.isFinite() ? this.maxCharge.coulomb : "Infinity"
      }
    }


    options.add(instanceNode);
    options.next(this.outC, { ...options, from: this })
  }
  /* getStructure() {
     const nodes = [];
     this.register({
       nodes,
       until: this.inC,
       from: this,
       parrallelLevel: 0,
       registrationTimestamp: Date.now(),
       withSerialise: false,
       forCalculation: false,
       ne
     });
     return nodes;
   }*/
  override toJSON(o?: SerialiseOptinos) {
    //throw new Error("deprecated")
    if (o.fromConnection == this.inC) {
      return {
        type: Battery.typeName,
        ref: this.nodeUuid
      }
    }

    return {
      type: Battery.typeName,
      prov: o.serialise(this.outC),
      voltage: this.voltage,
      ui: this.uiNode,
      enabled: this.enabled,
      chargePercent: this.remainingCharge.isFinite() ? this.getChargePercentage() : "Infinity",
      maxAmpere: this.maxCharge.isFinite() ? this.maxCharge.coulomb : "Infinity"
    };
  }

}

type jsonType = ReturnType<(Battery)['toJSON']>
