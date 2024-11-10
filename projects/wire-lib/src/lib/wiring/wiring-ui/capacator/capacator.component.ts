import { Component, OnInit } from '@angular/core';
import { UINode } from '../ui-node';
import { Capacitor } from '../../wirings/capacator';
import { CommonModule } from '@angular/common';
import { InOutComponent } from '../in-out/in-out.component';
import type { Collection } from '../../wirings/collection';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-capacator',
  templateUrl: './capacator.component.html',
  styleUrls: ['./capacator.component.css'],
  imports: [CommonModule, InOutComponent, MatIconModule],
  standalone: true
})
export class CapacatorComponent extends UINode.of(Capacitor) implements OnInit {


  constructor() {
    super(new Capacitor(1, 10))
  }


  static templateIcon = "density_large"

  override getIcon(): string {
    return CapacatorComponent.templateIcon
  }
  get colNode() {
    return this.node as any as Collection
  }
  ngOnInit() {
  }

}
