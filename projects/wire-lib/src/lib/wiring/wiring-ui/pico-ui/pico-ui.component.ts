import { Component, OnInit, Injector, ViewChild, type ElementRef, ViewChildren, type QueryList, type AfterViewInit } from '@angular/core';
import { UINode } from '../ui-node';
import { PiPico } from '../../wirings/microprocessor/pipico';
import { InOutComponent } from '../in-out/in-out.component';
import { CommonModule } from '@angular/common';
import type { Wire } from '../../wirings/wire';
import type { Switch } from '../../wirings/switch';
import { Collection } from '../../wirings/collection';


@Component({
  selector: 'app-pico-ui',
  templateUrl: './pico-ui.component.html',
  styleUrls: ['./pico-ui.component.scss'],
  standalone: true,
  imports: [InOutComponent, CommonModule]
})
export class PicoUiComponent extends UINode<PiPico> {
  override factory() {
    return PiPico;
  };



  @ViewChildren("inout")
  connectorElements: QueryList<InOutComponent>

  public static templateIcon = "asset:assets/icons/pipico.png"


  topUiComponets: Array<Collection>

  @ViewChild("textscr")
  ref: ElementRef<HTMLTextAreaElement>
  bottomUiComponents: Collection[];

  getIcon(): string {
    return "assets/icons/pipico.png"
  }

  constructor(injector: Injector) {
    super(new PiPico(), injector)


  }


  templateIcon: string;

  override initNodes(): void {
    this.topUiComponets = this.node.topRow.map(pin => new Collection(pin, null))
    this.bottomUiComponents = this.node.bottomRow.map(pin => new Collection(pin, null))

    this.node.gpios.forEach(gpio => {
      gpio.boundResistor.uiNode = this
    })
  }
  override getWires(): Array<Wire> {
    const wires = [];

    for (let i = 0; i < this.node.pinList.length; i++) {
      const pin = this.node.pinList[i]
      if (pin?.connectedTo) {
        wires.push(pin.connectedTo);
      }
    }
    return wires
  }


  override getInOutComponent(id: string) {
    return this.connectorElements?.find(el => el.node.inC.id === id)
  }

  getTextAreaHeight() {
    return Math.min(this.node.script.split('\n').length, 10) * 18 + 'px'
  }
}
