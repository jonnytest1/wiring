import type { FromJsonOptions } from '../serialisation';
import { Connection } from './connection';
import { Switch } from './switch';
import type { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class ToggleSwitch extends Switch {



  override negatedOutC = new Connection(this, "switch_out_negated")

  static override fromJSON(json: any, context: FromJsonOptions): Wire {
    const self = new ToggleSwitch();
    self.controlRef = json.controlRef
    if (context.wire) {
      context.wire.connect(self.inC)
    }
    context.controlRefs[json.controlRef] = [self]
    const connected = context.elementMap[json.outC.type].fromJSON(json.outC, { ...context, inC: self.outC })
    if (json.negatedOutC) {
      context.elementMap[json.negatedOutC.type].fromJSON(json.negatedOutC, { ...context, inC: self.negatedOutC })
    }
    //JsonSerializer.createUiRepresation(tSwitch, json, context)
    return connected
  }
  override getTotalResistance(from: any, options: GetResistanceOptions): ResistanceReturn {
    if (this.enabled) {
      return super.getTotalResistance(from, options)
    } else {
      return this.negatedOutC.getTotalResistance(this, options)
    }
  }
  override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    let superCurrent = super.pushCurrent({
      ...options,
      current: this.enabled ? options.current : 0
    }, from);
    let negatedCurrent = this.negatedOutC.pushCurrent({
      ...options,
      current: this.enabled ? 0 : options.current
    }, this);


    if (this.enabled) {
      return superCurrent
    } else {
      return negatedCurrent
    }

  }
  override applytoJson(json: Record<string, any>): void {
    super.applytoJson(json)
    json['negatedOutC'] = this.negatedOutC.connectedTo
  }
}
