
import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation'
import { Connection } from './connection'
import { noConnection } from './resistance-return';
import { Resistor } from "./resistor"
import { Impedance } from './units/impedance';
import type { Wire } from './wire'
import type { GetResistanceOptions, ResistanceReturn } from './wiring.a'
export class Switch extends Resistor {

  static override typeName = "Switch"

  enabled = false
  public controlRef: string

  negatedOutC = new Connection(this, "switch_out_negated")
  constructor() {
    super(0)
  }

  override getImpedance() {
    if (this.enabled) {
      return super.getImpedance()
    }
    return Impedance.BLOCKED
  }


  override applytoJson(json: Record<string, any>): void {
    super.applytoJson(json);
    json['controlRef'] = this.controlRef
    json['enabled'] = this.enabled
  }

}