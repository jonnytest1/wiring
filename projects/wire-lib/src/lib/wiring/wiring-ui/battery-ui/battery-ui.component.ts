import type { TemplateRef } from '@angular/core';
import { Component, Injector } from '@angular/core';
import type { FromJson } from '../../serialisation';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import type { Connection } from '../../wirings/connection';
import { UINode } from '../ui-node';
import { Charge } from '../../wirings/units/charge';

@Component({
  selector: 'app-battery-ui',
  templateUrl: './battery-ui.component.html',
  styleUrls: ['./battery-ui.component.less']
})
export class BatteryUiComponent extends UINode<Battery> {
  override factory() {
    return Battery
  };

  constructor(injector: Injector) {
    super(new Battery(5, 0.01), injector);
  }

  public static readonly templateIcon = 'battery_charging_full';
  batteryCollection: Collection;

  getIcon(): string {
    const percent = this.getChargedPercent();
    const perSeven = Math.floor(percent / (100 / 7));

    if (perSeven === 7) {
      return `battery_full`;
    }
    return `battery_${perSeven}_bar`;


  }

  getChargedPercent() {
    return +this.node.getChargePercentage().toPrecision(5) * 100
  }

  ngOnInit() {
    this.batteryCollection = new Collection(this.node.inC, this.node.outC);
  }

  refill() {
    this.node.remainingCharge = this.node.maxCharge.copy();
  }


  updateMaxAmpere(val) {
    this.node.maxCharge = new Charge(+val * 3600)
    this.refill()
  }

  logStructure(template: TemplateRef<any>) {
    this.openSnackbar();
    // this.snackbarRef = this.snackbar.openFromTemplate(template)

    /*const structureStart = this.node.get batteryCollection?.outC?.connectedTo?.outC?.parent as (SerialConnected | Parrallel)
        console.log(structureStart.getStructure(true));*/
  }
}
