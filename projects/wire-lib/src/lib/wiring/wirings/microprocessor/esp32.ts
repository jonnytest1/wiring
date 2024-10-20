import { Connection } from '../connection';
import type { Executer } from './code-processor/executer';
import { MicroPythonExecuter } from './code-processor/micropython-lib/executer';
import { MicroProcessorBase } from './microprocessor-base';

export class Esp32 extends MicroProcessorBase {

    override operationResistance: 2;

    override executer = new MicroPythonExecuter(this);


    constructor() {
        super({
            pinCount: 20,
            tagMap: {
                inputPwr: [10, 8],
                ground: [9]
            }
        })
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
}