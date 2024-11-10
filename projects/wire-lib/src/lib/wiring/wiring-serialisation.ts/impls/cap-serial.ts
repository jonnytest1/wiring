import { from } from 'rxjs';
import { Capacitor } from '../../wirings/capacator';
import { SerialisationFactory, type JsonFnc } from '../serialisation-factory';

export class CapacitorSerialise extends SerialisationFactory.of(Capacitor) {
    override map = this.json({
        toJSON(obj, options) {
            return {
                capacitance: obj.capacitance.toMicro(),
                maxVoltage: obj.maxVoltage.voltage,
                outC: options.serialise(obj.outC)
            }
        },
        initFromJson(fromJSON, options) {




            return {
                node: new Capacitor(fromJSON.capacitance, fromJSON.maxVoltage ?? 10)
            }
        },
        applyFromJSON(obj, fromJSON, context) {

            if (context.wire) {
                context.wire.connect(obj.inC)
            }



            context.loadElement(fromJSON.outC, { ...context, inC: obj.outC });
        },
    })

}