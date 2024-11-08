
import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation';
import type { RegisterOptions } from './interfaces/registration';
import { noConnection } from './resistance-return';
import { Resistor } from './resistor';
import { Impedance } from './units/impedance';
import { Voltage } from './units/voltage';
import type { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ProcessCurrentOptions, ProcessCurrentReturn, ResistanceReturn, Wiring } from './wiring.a';

export class LED extends Resistor {


  static override typeName = "LED"
  brightness: number = 0;

  blown = false

  readonly maxVoltageDrop = 2.4
  readonly maxVoltageDropV = new Voltage(2.4)

  constructor() {
    super(5)
  }

  override getImpedance(): Impedance {
    if (this.blown) {
      return Impedance.BLOCKED
    }
    return super.getImpedance()
  }

  /* override getTotalResistance(from: any, options: GetResistanceOptions): ResistanceReturn {
     if (this.blown) {
       return noConnection(this)
     }
     return super.getTotalResistance(from, options)
   }*/
  override register(options: RegisterOptions): void | false {
    if (options.from === this.outC) {
      return false
    }

    super.register(options)
  }

  override processCurrent(options: ProcessCurrentOptions): ProcessCurrentReturn {
    const returnCurrent = super.processCurrent(options)
    if (options.current.isPositive()) {
      if (this.voltageDropV > this.maxVoltageDropV) {
        this.blown = true;
        this.solver.recalculate()
        return
      }
      this.brightness = this.voltageDropV.voltage * 100 / this.maxVoltageDrop
    } else {
      this.brightness = 0
    }

    return returnCurrent
  }
  /**@deprecated */
  /* override pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
     const returnCurrent = super.pushCurrent(options, from)
     if (options.current > 0) {
       if (this.voltageDrop > this.maxVoltageDrop) {
         this.blown = true;
         this.solver.recalculate()
         return
       }
       this.brightness = this.voltageDrop * 100 / this.maxVoltageDrop
     } else {
       this.brightness = 0
     }
 
     return returnCurrent
   }*/
}