import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation';
import { Battery } from './battery';
import { Resistor } from './resistor';
import type { Wire } from './wire';
import type { CurrentOption, Wiring, CurrentCurrent } from './wiring.a';

export class Transformator extends Resistor {
  constructor() {
    super(5);
    this.providingBattery.enabled = true;
  }

  providingBattery = new Battery(null, Infinity);

  turnsRatio = 200 / 100;  // 200 rounds on this side vs 100 on the receiving



  override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    const batteryVoltage = options.voltage / this.turnsRatio;
    const power = options.current * options.voltage;
    // const current = power / batteryVoltage;
    this.providingBattery.voltage = batteryVoltage;
    this.providingBattery.checkContent(options.deltaSeconds);

    return super.pushCurrent({
      ...options,
      current: 0,
      voltage: 0,
    }, from);
  }


  override applytoJson(json: Record<string, any>): void {
    super.applytoJson(json);
    json['providingBattery'] = this.providingBattery;
    json['turnRatio'] = this.turnsRatio;
  }


  override readFromJson(json: Record<string, any>): void {
    super.readFromJson(json)
    this.turnsRatio = json['turnRatio'];
  }

}
