import { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from '../wiring.a';
import { v4 } from "uuid"
import { Connection } from '../connection';
import type { RegisterOptions, REgistrationNode } from '../interfaces/registration';
import { v4 as uuid } from 'uuid';
import { Battery } from '../battery';
import { Collection } from '../collection';
import { getJsonStringifyTime, JsonSerializer, type FromJsonOptions } from '../../serialisation';
import { MicroPythonExecuter } from './code-processor/micropython-lib/executer';
import { MicroProcessorBase } from './microprocessor-base';
import type { SerialiseOptinos } from '../../wiring-serialisation.ts/serialisation-factory';
export type PinMode = "OUT" | "IN"
export class PiPico extends MicroProcessorBase {

  static override typeName = "PiPico"

  controlRef = v4()
  set script(newScript: string) {
    this.executer.update(newScript)
  }

  get script() {
    return this.executer.code
  }


  started = false



  operationResistance = 10




  instanceUuid = uuid();

  jsonActive = false
  jsonStringifyTs: number;

  executer = new MicroPythonExecuter(this)




  constructor() {
    super({
      pinCount: 40,
      tagMap: {
        inputPwr: [
          40, 39, //5v
          36//3V
        ],
        ground: [
          3, 8, 13, 18, 38, 33, 28, 23
        ]
      }
    })
    // 10, "pipico"
    //for (let pinIndex = 0; pinIndex < this.pinList.length; pinIndex++) {
    //const pin = this.pinList[pinIndex]
    //pin.controlRef = this.controlRef
    //}
  }
  updateCode(newCoe: string) {
    this.script = newCoe
    this.executer.update(newCoe)
  }

  override toJSON(context: SerialiseOptinos) {
    if (!getJsonStringifyTime()) {
      throw new Error("deprecated call")
    }
    if (this.jsonStringifyTs === getJsonStringifyTime()) {
      return {
        type: PiPico.typeName,
        ref: this.instanceUuid,
        pinConnection: this.getId(context.fromConnection)
      }
    }


    this.jsonStringifyTs = getJsonStringifyTime()
    const con = {}
    if (!this.batteryConnection) {
      debugger
      /*this.getBatteryConnection({
        addStep(w) {

        },
        checkTime: Date.now(),
      })*/
    }

    Object.keys(this.pinMap)
      .filter(pinid => !this.tagMap.ground.includes(+pinid))
      .filter(pinid => this.pinMap[pinid].mode === "OUT")
      .forEach(pinid => {
        const pin = this.pinMap[+pinid];

        con[pinid] = {
          connection: pin.con.connectedTo,
          mode: pin.mode,
          outputValue: pin.outputValue
        }
      })

    return {
      type: PiPico.typeName,
      uuid: this.instanceUuid,
      code: this.script,
      ui: this.uiNode,
      connections: con,
      batteryCon: {
        id: this.reversePinMap.get(this.batteryConnection),
        connection: this.batteryConnection.connectedTo
      }
    }
  }


}