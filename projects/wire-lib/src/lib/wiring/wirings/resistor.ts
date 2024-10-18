
import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation';
import type { UINode } from '../wiring-ui/ui-node';
import { Collection } from './collection';
import { Connection } from './connection';
import type { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';
import { v4 } from "uuid"
import type { RegisterOptions, REgistrationNode } from './interfaces/registration';

export class Resistor extends Collection implements Wiring {


  override uiNode?: UINode;

  voltageDrop: number
  incomingCurrent: CurrentOption;

  uuid = v4()
  constructor(public resistance: number) {
    super(null, null)
    this.inC = new Connection(this, "res_in")
    this.outC = new Connection(this, "res_out")
  }
  override getTotalResistance(from, options: GetResistanceOptions): ResistanceReturn {
    const afterResistance = this.outC.getTotalResistance(this, options);
    return { ...afterResistance, resistance: afterResistance.resistance + this.resistance }
  }


  evaluateFunction(options: CurrentOption) {
    // to implement
  }

  override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    this.incomingCurrent = { ...options }

    this.voltageDrop = (options.current * this.resistance)
    this.evaluateFunction(options)
    return this.outC.pushCurrent({
      ...options,
      voltage: options.voltage - this.voltageDrop
    }, this);
  }
  override  register(options: RegisterOptions) {
    const repr: REgistrationNode = { name: this.constructor.name };
    if (options.withSerialise) {
      repr.details = {
        resistance: this.resistance,
        uuid: this.uuid,
        ui: this.uiNode,
      }
    }

    options.nodes.push(repr)
    return this.outC.register({ ...options, from: this })
  }
  override applytoJson(json: Record<string, any>): void {
    json['resistance'] = this.resistance
    json['outC'] = this.outC.connectedTo
    json['ui'] = this.uiNode
    json['uuid'] = this.uuid
  }

  readFromJson(json: Record<string, any>) {
    this.uuid = json['uuid']
    this.resistance = json['resistance']
  }
}