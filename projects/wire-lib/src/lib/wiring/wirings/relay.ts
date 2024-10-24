import type { ControllerRef, FromJsonOptions } from '../serialisation';
import { Resistor } from './resistor';
import { v4 } from "uuid"
import type { CurrentOption } from './wiring.a';
import { ToggleSwitch } from './toggle-switch';


export class Relay extends Resistor implements ControllerRef {
  static override typeName = "Relay"
  controlRef = v4()

  switch1 = new ToggleSwitch()

  setSwitchOneEnabled(value: boolean) {
    this.switch1.enabled = value;
  }

  constructor() {
    super(70)
    this.setSwitchOneEnabled(false)
    this.switch1.controlRef = this.controlRef

  }
  setControlRef(controlRef: any, key: string) {
    this.switch1 = controlRef[0]
  }

  override evaluateFunction(options: CurrentOption): void {
    this.setSwitchOneEnabled(false)
    if (options.current > 0) {
      this.setSwitchOneEnabled(true)
    }
  }
}