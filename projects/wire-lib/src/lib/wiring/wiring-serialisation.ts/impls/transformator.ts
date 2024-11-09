import { JsonSerializer, type FromJsonOptions } from '../../serialisation';
import type { Battery } from '../../wirings/battery';
import { Transformator } from '../../wirings/transformator';
import type { Wire } from '../../wirings/wire';
import { SerialisationFactory, type JsonFnc, type SerialisationReturn } from '../serialisation-factory';
import { BatteryFactory } from './battery-factory';


const batterySErialiser = new BatteryFactory()

export class TransformatorSer extends SerialisationFactory.of(Transformator) {
    override map = this.json({
        toJSON(obj, options) {
            return {
                providingBattery: batterySErialiser.map.toJSON(this.providingBattery, { ...options }),
                turnRatio: obj.turnsRatio
            }
        },
        initFromJson(fromJSON, context) {
            debugger
            const self = new Transformator();

            if (context.wire) {
                context.wire.connect(self.inC);
            }


            return {
                node: self,
            };
        },
        applyFromJSON(obj, json, context) {
            debugger

            obj.providingBattery = context.loadElement(json.providingBattery,
                { ...context, wire: undefined, inC: undefined }) as unknown as Battery;

            // const connected = context.loadElement(json.outC, { ...context, inC: obj.outC });

            // return {
            //    ...connected,
            //     node: obj,
            /// };
        },
    })



}