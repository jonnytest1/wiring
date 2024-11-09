import { Capacitor } from '../../wirings/capacator';
import { SerialisationFactory, type JsonFnc } from '../serialisation-factory';

export class CapacitorSerialise extends SerialisationFactory.of(Capacitor) {
    override map = this.json({
        toJSON(obj, options) {
            return {
                capacitance: obj.capacitance.farad
            }
        },
        initFromJson(fromJSON, options) {
            debugger
            return {

            } as any
        },
        applyFromJSON(fromJSON, options) {
            debugger
            return {

            } as any
        },
    })

}