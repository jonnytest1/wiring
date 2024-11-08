import { getJsonStringifyTime } from '../../serialisation';
import { Connection } from '../connection';
import { CppExecuter, type CppExecuterParams } from './code-processor/c++-lib/executer';
import type { Executer } from './code-processor/executer';
import { MicroPythonExecuter } from './code-processor/micropython-lib/executer';
import { MicroProcessorBase } from './microprocessor-base';


export type Esp32Provides = CppExecuterParams


export class Esp32 extends MicroProcessorBase {
    static override typeName = "Esp32"
    override operationResistance = 2;

    override executer: CppExecuter
    ledMatrix: string[][];
    jsonStringifyTs: number;


    constructor() {
        super({
            pinCount: 20,
            tagMap: {
                inputPwr: [10, 8],
                ground: [9]
            }
        })
        this.executer = new CppExecuter(this);
    }

    setEspProvides(esp32Provides: CppExecuterParams) {
        this.executer.setEspProvides(esp32Provides)
    }

    setLedMatrix(ledMAtrix: Array<Array<string>>) {
        this.ledMatrix = ledMAtrix
    }

    set script(newScript: string) {
        this.executer.update(newScript)
    }

    get script() {
        return this.executer.code
    }
    override getTopRowPinId(con: any, i: any): number {
        return 33 + i
    }
    override getBottomRowPinId(con: any, i: any): number {
        return 10 - i
    }


    override toJSON(from, context) {
        if (!getJsonStringifyTime()) {
            throw new Error("deprecated call")
        }
        if (this.jsonStringifyTs === getJsonStringifyTime()) {
            return {
                type: Esp32.typeName,
                ref: this.nodeUuid,
                pinConnection: this.getId(context.parents.at(-1).outC)
            }
        }


        this.jsonStringifyTs = getJsonStringifyTime()
        const con = {}
        if (!this.batteryConnection) {
            debugger
            /* this.getBatteryConnection({
                 addStep(w) {
 
                 },
                 checkTime: Date.now()
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
            type: Esp32.typeName,
            uuid: this.nodeUuid,
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