
import type { MicroProcessorBase } from '../../microprocessor-base'
import type { PinMode, PiPico } from '../../pipico'




export function boundPins(pipico: MicroProcessorBase) {
  function Pin(pin, mode: PinMode) {

    pipico.pinMap[pin].mode = mode

    return {
      toggle() {
        pipico.pinMap[pin].toggle()

      }
    }
  }
  Pin.OUT = "OUT"
  Pin.IN = "IN"

  return Pin
}


