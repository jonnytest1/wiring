import { v4 } from 'uuid';
import { Collection } from './collection';
import { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { noResistance } from './resistance-return';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ProcessCurrentOptions, ProcessCurrentReturn, ResistanceReturn, Wiring } from './wiring.a';
import { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import { Current } from './units/current';
import { Charge } from './units/charge';

export class Battery extends Collection {



  static override typeName = "Battery"

  constructor(public voltage: number | null, ampereHours: number) {
    super(null, null);
    this.outC = new Connection(this, 'bat_prov');
    this.inC = new Connection(this, 'bat_cons');
    this.ampereSeconds = ampereHours * 60 * 60;
    this.maxAmpereSeconds = this.ampereSeconds;

    // this.controlContainer = new SerialConnected()

    // Wire.connect(this.controlContainer.outC, this.inC)
  }


  ampereSeconds: number;

  networkResistance = Impedance.ZERO;

  iterationTime: number;

  currentCurrent_ampere: number;


  maxAmpereSeconds: number;

  enabled = false;


  override providedVoltage(): Voltage {
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
    if (isNaN(this.networkResistance.impedance) || this.ampereSeconds == 0) {
      return options
    }
    debugger
    const batteryVoltage = new Voltage(this.voltage);
    const current = options.data.getCurrent(this)
    try {
      return {
        ...options,
        supplyVoltage: options.supplyVoltage.with(batteryVoltage),
        //current: current
      }
    } finally {
      const processedCharge = Charge.from(current, options.deltaTime);
      this.currentCurrent_ampere = Math.max(this.currentCurrent_ampere - processedCharge.coulomb, 0)
    }
  }

  public getProjectedDurationMinutes(): number {
    const remainingAmpereSeconds = this.ampereSeconds * 60 * 60;
    const remainingSeconds = remainingAmpereSeconds / this.currentCurrent_ampere;
    return remainingSeconds / (60 * 60);
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
        charge: this.ampereSeconds === Infinity ? "Infinity" : this.ampereSeconds / (60 * 60),
        maxAmpere: this.maxAmpereSeconds === Infinity ? "Infinity" : this.maxAmpereSeconds
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
  override toJSON(key?) {
    //throw new Error("deprecated")
    if (key == "connectedWire") {
      return {
        type: Battery.typeName,
        ref: this.nodeUuid
      }
    } else if (key) {
      return {
        type: Battery.typeName,
        ref: this.nodeUuid
      }
    }
    return {
      type: Battery.typeName,
      prov: this.outC.connectedTo,
      voltage: this.voltage,
      nodeUuid: this.nodeUuid,
      ui: this.uiNode,
      enabled: this.enabled,
      charge: this.ampereSeconds === Infinity ? "Infinity" : this.ampereSeconds / (60 * 60),
      maxAmpere: this.maxAmpereSeconds === Infinity ? "Infinity" : this.maxAmpereSeconds
    };
  }

}

type jsonType = ReturnType<(Battery)['toJSON']>
