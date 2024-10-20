import { jsPython } from 'jspython-interpreter'
import { boundPins } from './pin'
import { TimerContext } from './timer'
import type { PiPico } from '../../pipico'
import { Executer } from '../executer'
import type { MicroProcessorBase } from '../../microprocessor-base'

export class MicroPythonExecuter extends Executer {

  pythonInstance: any
  timer: TimerContext
  code: string =
    `
from machine import Pin, Timer
led = Pin(16, Pin.OUT)
timer = Timer()
def blink(timer):
  led.toggle()
timer.init(2.5, Timer.PERIODIC, blink)`



  constructor(environment: MicroProcessorBase) {
    super()
    this.timer = new TimerContext()
    this.prepare(environment)
  }


  override start() {
    super.start()
    this.pythonInstance.evaluate(this.code).then(resp => {

      console.log("finished synchronous execution")
    })
  }


  prepare(environment: MicroProcessorBase) {
    this.pythonInstance = jsPython()
    this.pythonInstance.registerPackagesLoader((p) => {

      if (p === "machine") {
        return {
          Pin: boundPins(environment), //
          Timer: this.timer.boundModule()
        }
      }


      debugger
      return {}
    })


  }
  update(newCode: string) {
    this.code = newCode

    if (this.running) {
      this.kill()
      this.start()
    }
  }


  override kill() {
    super.kill()
    this.timer.stop()
  }


}