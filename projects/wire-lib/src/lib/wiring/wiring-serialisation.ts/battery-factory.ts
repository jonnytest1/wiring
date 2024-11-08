import { JsonSerializer, type FromJsonOptions } from '../serialisation';
import { Battery } from '../wirings/battery';
import type { Connection } from '../wirings/connection';
import { Charge } from '../wirings/units/charge';
import { SerialisationFactory } from './serialisation-factory';

export class BatteryFactory extends SerialisationFactory<Battery> {
    override factory = Battery;


    private refMap: Record<string, Battery> = {}

    override fromJSON(fromJSON: any, options: FromJsonOptions) {
        if (typeof fromJSON !== "string") {

            if ("ref" in fromJSON) {
                const targetBattery = this.refMap[fromJSON.ref]
                return {
                    node: targetBattery,
                    wire: options.wire
                }

            }



            if (fromJSON.charge == "Infinity") {
                fromJSON.charge = Infinity
            }
            if (fromJSON.maxAmpere == "Infinity") {
                fromJSON.maxAmpere = Infinity
            }

            if (fromJSON.chargePercent) {
                fromJSON.charge = fromJSON.chargePercent * fromJSON.maxAmpere
            }

            const battery = new Battery(fromJSON.voltage, +(fromJSON.charge ?? 0.001));
            battery.enabled = fromJSON.enabled;
            this.refMap[fromJSON.nodeUuid] = battery;
            battery.maxCharge = new Charge(+(fromJSON.maxAmpere ?? +(fromJSON.charge ?? 0.0001)));
            JsonSerializer.createUiRepresation(battery, fromJSON as any, options);

            const prov = fromJSON.prov
            if ("type" in prov) {
                const outC = options.loadElement(prov, {
                    ...options,
                    inC: battery.outC,
                });
                if (outC) {
                    outC.wire.connect(battery.inC);
                }

            } else {
                throw new Error('missing serialisation for ' + prov);
            }
            return {
                node: battery,
                wire: null
            };
        }
    }

}