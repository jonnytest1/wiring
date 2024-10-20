
import type { MicroProcessorBase } from '../../microprocessor-base'
import type { PinMode, PiPico } from '../../pipico'




export function boundPins(pipico: MicroProcessorBase) {
  function Pin(pin, mode: PinMode) {

    pipico.pinMap[pin].mode = mode

    return {
      toggle() {
        pipico.pinMap[pin].outputValue = 1 - pipico.pinMap[pin].outputValue

      }
    }
  }
  Pin.OUT = "OUT"
  Pin.IN = "IN"

  return Pin
}


