import { JsonSerializer, type FromJsonOptions } from '../../serialisation';
import { Resistor } from '../../wirings/resistor';
import type { Wire } from '../../wirings/wire';
import { SerialisationFactory, type JsonFnc, type JsonSerialisationtype, type SerialisationReturn } from '../serialisation-factory';

export class ResistorSerial extends SerialisationFactory<Resistor> {

    override factory = Resistor;


    override map = this.json({
        toJSON: (obj, options) => {

            return obj.toJSON(options)
        },
        initFromJson(fromJSON, options) {
            const self = new Resistor(fromJSON.resistance);


            return {
                node: self,
                wire: null
            }
        },
        applyFromJSON: (obj, json, context: FromJsonOptions) => {
            if ("ref" in json) {
                throw new Error("no ref ")
            }
            obj.resistance = json.resistance
            if (context.wire) {
                context.wire.connect(obj.inC)
            }
            //JsonSerializer.createUiRepresation(obj, json, context)
            const connected = context.loadElement(json.outC, { ...context, inC: obj.outC })


            return {
                ...connected,
                node: null
            }


        },

    })


}