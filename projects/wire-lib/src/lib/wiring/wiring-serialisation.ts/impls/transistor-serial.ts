import { Transistor } from '../../wirings/transistor';
import { SerialisationFactory, type JsonFnc } from '../serialisation-factory';

export class TransistorSErialisation extends SerialisationFactory.of(Transistor) {
    override map = this.json({
        toJSON: o => {
            return {

            }
        },
        initFromJson(fromJSON, options) {
            debugger
            return {} as any
        },
        applyFromJSON: () => {
            debugger
            return {} as any
        }
    })
}