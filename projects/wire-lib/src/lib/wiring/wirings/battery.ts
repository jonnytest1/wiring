
import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation';
import { Collection } from './collection';
import { Connection } from './connection';
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';
import { noResistance } from './resistance-return';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class Battery extends Collection {

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

  networkResistance = 0.000;

  iterationTime: number;

  currentCurrent_ampere: number;

  maxAmpereSeconds: number;

  enabled = false;

  override getTotalResistance(from: Connection | null, options: GetResistanceOptions): ResistanceReturn {
    options.addStep(this)
    if (!from) {
      return this.outC.getTotalResistance(this, options);
    } else {
      return noResistance(this);
    }

  }

  override  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    if (!from) {
      return this.outC.pushCurrent(options, this);
    } else {
      if (options.voltage > 0.001) {
        throw new Error('voltage should be 0 right here but was ' + options.voltage.toPrecision(3));
      }
      return {
        voltage: 0,
        remainingAmpereHours: this.ampereSeconds,
        current: 0,
        afterBlockCurrent: []
      };
    }
  }


  checkContent(deltaSeconds: number) {
    if (this.enabled) {
      const steps = []
      const opts: GetResistanceOptions = {
        addStep(w) {
          steps.push(w)
        }
      };
      const totalResistance = this.getTotalResistance(null, opts);
      this.networkResistance = totalResistance.resistance;
    } else {
      this.networkResistance = NaN;
    }

    if (isNaN(this.networkResistance) || this.ampereSeconds == 0) {
      this.currentCurrent_ampere = 0;
      this.pushCurrent({
        current: 0,
        voltage: 0,
        deltaSeconds: deltaSeconds,
        resistance: 0,
        triggerTimestamp: Date.now()
      }, null);
    } else {
      this.currentCurrent_ampere = this.voltage / this.networkResistance;
      this.currentCurrent_ampere = Math.min(this.maxAmpereSeconds, this.currentCurrent_ampere);
      const result = this.pushCurrent({
        current: this.currentCurrent_ampere,
        voltage: this.voltage,
        deltaSeconds: deltaSeconds,
        resistance: 0,
        triggerTimestamp: Date.now()
      }, null);
      const ampereSeconds = this.currentCurrent_ampere * deltaSeconds;

      this.ampereSeconds = Math.max(this.ampereSeconds - ampereSeconds, 0);
    }

  }

  public getProjectedDurationMinutes(): number {
    const remainingAmpereSeconds = this.ampereSeconds * 60 * 60;
    const remainingSeconds = remainingAmpereSeconds / this.currentCurrent_ampere;
    return remainingSeconds / (60 * 60);
  }


  override register(options: RegisterOptions) {
    const instanceNode: REgistrationNode = { name: "Battery" };
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

    options.nodes.push(instanceNode);
    this.outC?.register(options);
  }
  getStructure() {
    const nodes = [];
    this.register({
      nodes,
      until: this.inC,
      from: this,
      parrallelLevel: 0,
      registrationTimestamp: Date.now(),
      withSerialise: false
    });
    return nodes;
  }
  override toJSON(key?) {
    //throw new Error("deprecated")
    if (key == "connectedWire") {
      return "BatteryRef"
    } else if (key) {
      return "BatteryRef"
    }
    return {
      type: this.constructor.name,
      prov: this.outC.connectedTo,
      voltage: this.voltage,
      ui: this.uiNode,
      enabled: this.enabled,
      charge: this.ampereSeconds === Infinity ? "Infinity" : this.ampereSeconds / (60 * 60),
      maxAmpere: this.maxAmpereSeconds === Infinity ? "Infinity" : this.maxAmpereSeconds
    };
  }

}

type jsonType = ReturnType<(Battery)['toJSON']>
