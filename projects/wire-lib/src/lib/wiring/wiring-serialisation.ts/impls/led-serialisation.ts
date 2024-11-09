import { JsonSerializer, type FromJsonOptions } from '../../serialisation';
import { LED } from '../../wirings/led';
import { SerialisationFactory } from '../serialisation-factory';
import { ResistorSerial } from './resistor';




export class LedSerializer<J> extends SerialisationFactory<LED> {

    override factory = LED;



    override map = this.json({
        toJSON: (obj, c) => {
            // rest is done in resistor
            return {

            }
        },
        initFromJson(fromJSON, context) {
            const self = new LED();

            // done in resistor
            /*if (context.wire) {

                context.wire.connect(self.inC)
            }*/
            return {
                node: self,
                wire: null
            }
        },
        applyFromJSON(obj, json, context) {

            //debugger
            //const connected = context.loadElement(json.outC, { ...context, inC: obj.outC })

            /* return {
                 wire: connected.wire,
                 node: obj
             }*/

        },

    })


}