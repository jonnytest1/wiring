
import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation'
import { Connection } from './connection'
import { noConnection } from './resistance-return';
import { Resistor } from "./resistor"
import type { Wire } from './wire'
import type { GetResistanceOptions, ResistanceReturn } from './wiring.a'
export class Switch extends Resistor {

  enabled = false
  public controlRef: string

  negatedOutC = new Connection(this, "switch_out_negated")
  constructor() {
    super(0)
  }
  override getTotalResistance(from: any, options: GetResistanceOptions): ResistanceReturn {
    options.addStep(this)
    if (this.enabled) {
      return super.getTotalResistance(from, options)
    }
    return noConnection(this)
  }


  override applytoJson(json: Record<string, any>): void {
    super.applytoJson(json);
    json['controlRef'] = this.controlRef
    json['enabled'] = this.enabled
  }

}