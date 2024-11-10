import { inject, Injectable, InjectionToken } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ResolvablePromise } from '../utils/resolvable-promise';
import { ExamplePickerComponent } from './example-wires/example-picker/example-picker.component';
import { NODE_TEMPLATES } from './node-templates';
import { wiringJsonStringify, type FromJson, type FromJsonOptions } from './serialisation';
import { Battery } from './wirings/battery';
import { Wire } from './wirings/wire';
import { deserialize, startDeserialize } from './wiring-serialisation.ts/main-deserialisation';
import type { Wiring } from './wirings/wiring.a';
import type { PowerSupply } from './wirings/power-suppyly';


export const templateService = new InjectionToken<() => Promise<Array<{ name: string, content: string }>>>("loadtemplates")


@Injectable()
export class LocalStorageSerialization {
  private getTemplates = inject(templateService)

  constructor(private bottomSheet: MatBottomSheet) {

  }





  storeToLocal(batteries: Array<Battery>,
  ) {
    const nets = []

    for (const battery of batteries) {
      // stringify battery individually, cause no key is used to break up loops
      nets.push(wiringJsonStringify(battery))
    }
    debugger
    const json = JSON.stringify(nets);
    localStorage.setItem('el_network', json);
    console.log(json);
  }
  async load(options: Partial<FromJsonOptions & { remote: boolean }>): Promise<Array<PowerSupply>> {
    let parsed;
    if (options.remote) {
      const jsonStrings = await this.getTemplates();

      if (options.templateName) {
        const choice = jsonStrings.find(json => json.name === options.templateName)
        parsed = JSON.parse(choice.content)
      } else {
        const picked: string = await this.bottomSheet.open(ExamplePickerComponent, {
          data: jsonStrings
        })
          .afterDismissed()
          .toPromise();

        parsed = JSON.parse(picked)
      }


    } else {
      const netStr = localStorage.getItem('el_network');

      parsed = JSON.parse(netStr).map(str => JSON.parse(str))

    }
    return this.parseJson(parsed, options);

  }

  public async parseJson(parsed: Array<any>, options: Partial<FromJsonOptions>): Promise<PowerSupply[]> {
    const controlRegfs = {};
    const controllerRefs: Record<string, { setControlRef: (controlRef, uuid: string) => void; }> = {};

    const controlRefsinitialized = new ResolvablePromise<void>();
    options.uiSerialisationMap = new Map()

    NODE_TEMPLATES.forEach(t => {


      const nodeConstructor = t.prototype.factory() as FromJson<string>

      nodeConstructor.uiConstructor = t;

      options.uiSerialisationMap.set(nodeConstructor, t)
    });

    const powerSupplies = startDeserialize<PowerSupply>(parsed, {
      ...options,
      // controlRefs: controlRegfs,
      constorlRefsInitialized: controlRefsinitialized.prRef,
      // controllerRefs: controllerRefs,
      loadElement: deserialize as (json, context: FromJsonOptions<Wiring>) => Promise<Wiring>,
      references: {},
      withReference(uuid) {
        throw new Error("overwrite locally")
      },
      callbacks: {}
    })

    Object.keys(controllerRefs).forEach(key => {
      const controller = controllerRefs[key];
      const controlRef = controlRegfs[key];
      if (controlRef) {
        controller.setControlRef(controlRef, key);
      }
    });

    controlRefsinitialized.resolve();
    return powerSupplies;
  }
}
