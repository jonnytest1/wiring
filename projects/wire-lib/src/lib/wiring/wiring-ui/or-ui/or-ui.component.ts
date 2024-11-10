import { Component, OnInit } from '@angular/core';
import { UINode } from '../ui-node';
import { OrGate } from '../../wirings/or';






@Component({
  selector: 'app-or-ui',
  templateUrl: './or-ui.component.html',
  styleUrls: ['./or-ui.component.css']
})
export class OrUiComponent extends UINode.of(OrGate) implements OnInit {



  override getIcon(): string {
    return ">"
  }

  constructor() {
    super(new OrGate())
  }

  ngOnInit() {
  }

}
