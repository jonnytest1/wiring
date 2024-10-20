import { Component, OnInit, ViewChildren, type Injector, type QueryList } from '@angular/core';
import { UINode } from '../ui-node';
import { Esp32 } from '../../wirings/microprocessor/esp32';
import { Collection } from '../../wirings/collection';
import { InOutComponent } from '../in-out/in-out.component';
import { CommonModule } from '@angular/common';
import type { Wire } from '../../wirings/wire';
import type { ParrallelWire } from '../../wirings/parrallel-wire';

@Component({
  selector: 'app-esp32-ui',
  templateUrl: './esp32-ui.component.html',
  styleUrls: ['./esp32-ui.component.scss'],
  standalone: true,
  imports: [InOutComponent, CommonModule]
})
export class Esp32UiComponent extends UINode<Esp32> {

  public static templateIcon = "asset:assets/icons/esp8x8.png"
  topUiComponets: Collection[];
  bottomUiComponents: Collection[];

  @ViewChildren("inout")
  connectorElements: QueryList<InOutComponent>

  override getIcon(): string {
    return Esp32UiComponent.templateIcon
  }

  constructor() {
    super(new Esp32())


  }

  override initNodes(): void {
    this.topUiComponets = this.node.topRow.map(pin => new Collection(pin, null))
    this.bottomUiComponents = this.node.bottomRow.map(pin => new Collection(pin, null))
  }


  override getWires(): Array<Wire | ParrallelWire> {
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
    return this.connectorElements.find(el => el.node.inC.id === id)
  }

  getTextAreaHeight() {
    return Math.min(this.node.script.split('\n').length, 10) * 18 + 'px'
  }

}