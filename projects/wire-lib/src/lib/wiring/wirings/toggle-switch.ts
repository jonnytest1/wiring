import type { FromJsonOptions } from '../serialisation';
import { Connection } from './connection';
import { Switch } from './switch';
import type { Impedance } from './units/impedance';
import type { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class ToggleSwitch extends Switch {
  static override typeName = "ToggleSwitch"



  override negatedOutC = new Connection(this, "switch_out_negated")

  override getImpedance(): Impedance {
    if (this.enabled) {
      return super.getImpedance()
    } else {
      debugger
      //return this.negatedOutC.getTotalResistance(this, options)
    }
  }


  /*override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
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

  }*/
  override applytoJson(json: Record<string, any>): void {
    super.applytoJson(json)
    json['negatedOutC'] = this.negatedOutC.connectedTo
  }
}
