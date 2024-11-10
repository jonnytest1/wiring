import { JsonSerializer, type FromJsonOptions } from '../../serialisation';
import { Battery } from '../../wirings/battery';
import { Charge } from '../../wirings/units/charge';
import type { Wire } from '../../wirings/wire';
import { SerialisationFactory } from '../serialisation-factory';

export class BatteryFactory extends SerialisationFactory<Battery> {
    override factory = Battery;


    connectedWires: Set<Wire> = new Set()

    override init(): void {
        this.connectedWires = new Set()
    }

    map = this.json({
        deprecated(p: {
            charge: "Infinity" | number
        }) {

        },
        toJSON: (obj, o) => {
            return obj.toJSON(o)
        },
        initFromJson(fromJSON, options) {

            if ("ref" in fromJSON) {
                return options.withReference<Battery>(fromJSON.ref, obj => {
                    if (obj.inC.connectedTo !== options.wire) {
                        options.wire.connect(obj.inC);
                    }

                })

            }

            if (fromJSON.charge == "Infinity") {
                fromJSON.charge = Infinity
            }
            if (fromJSON.maxAmpere == "Infinity") {
                fromJSON.maxAmpere = Infinity
            }

            if (fromJSON.chargePercent) {
                fromJSON.charge = +fromJSON.chargePercent * +fromJSON.maxAmpere
            }

            const battery = new Battery(fromJSON.voltage, +(fromJSON.charge ?? 0.001));

            return {
                node: battery,
                wire: null
            };
        },
        applyFromJSON: (battery, fromJSON, options: FromJsonOptions) => {

            if ("ref" in fromJSON) {
                // return {
                // node: targetBattery,
                //  wire: options.wire
                // }
                return

            }
            battery.enabled = fromJSON.enabled;
            battery.maxCharge = new Charge(+(fromJSON.maxAmpere ?? +(fromJSON.charge ?? 0.0001)));

            const prov = fromJSON.prov
            if ("type" in prov) {
                const outC = options.loadElement(prov, {
                    ...options,
                    inC: battery.outC,
                });

            } else {
                throw new Error('missing serialisation for ' + prov);
            }
            /* return {
                 node: battery,
                 wire: null
             };*/

        },

    })
}