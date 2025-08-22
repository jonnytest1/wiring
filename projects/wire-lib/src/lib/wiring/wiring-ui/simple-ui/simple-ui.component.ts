import { Component, OnInit, ViewChildren, type QueryList } from '@angular/core';
import { UINode } from '../ui-node';
import type { Wiring } from '../../wirings/wiring.a';
import { CommonModule } from '@angular/common';
import { InOutComponent } from '../in-out/in-out.component';
import { Collection } from '../../wirings/collection';
import type { Connection } from '../../wirings/connection';
import type { Wire } from '../../wirings/wire';
import { MatIconModule } from '@angular/material/icon';


type KeyNames<T extends Wiring> = {
  [K in keyof T & string]: T[K] extends Connection ? K : never
}[keyof T & string]

export interface SimpleUiNodeOpts<T extends Wiring> {
  nodeC: new (...args) => T,


  icon: string

  text: string

  connections: Array<{
    conName: KeyNames<T>,
    offset: {
      x: number,
      y: number
    },
    vccToggle?: boolean
  }>
}


let vccLines = location.search.includes("showvcc")
export interface ConnectionDefinition {
  collectionMock: Collection;
  offset: {
    x: number;
    y: number;
  };
  conName?: string;
}
export function simpleUiComponent<T extends Wiring>(opts: SimpleUiNodeOpts<T>) {



  /***
   * 
   * [ngClass]="['con'+index]"
   * [ngStyle]="{marginLeft:-6+((index+1)*17)+'px'}"
   */


  @Component({
    template: ` 
      <div style="position:absolute">
       <app-in-out *ngFor="let con of connections"
                #inout
                class="connector top"
                [attr.title]="getTitle(con)"
                [title]="getTitle(con)"
                [singleInOut]="true"
                style="    position: absolute;"
                [ngStyle]="{left:con.offset.x+'px',top:con.offset.y+'px'}"
                [node]="con.collectionMock">

      
    </app-in-out>
    
    @if (opts.text.startsWith("t:")){
       <div style="">
          {{opts.text.split("t:")[1]}}
      </div>
     
    } @else{
      <mat-icon>{{opts.text}}</mat-icon>
    }

   
  </div>
    `,
    imports: [CommonModule, InOutComponent, MatIconModule],
    standalone: true
  })
  class SimpleUi extends UINode.of(opts.nodeC) implements OnInit {

    static readonly templateIcon = opts.icon
    override getIcon(): string {
      return opts.icon
    }


    opts = opts

    @ViewChildren("inout")
    connectorElements: QueryList<InOutComponent>

    connections: Array<ConnectionDefinition> = []
    constructor() {
      super({} as T)
    }

    getTitle(con: ConnectionDefinition) {
      return con.collectionMock.inC?.id ?? con.conName
    }
    override initNodes(): void {
      for (const con of opts.connections) {
        this.connections.push({
          ...con,
          collectionMock: new Collection(this.node[con.conName] as Connection, null),
          offset: con.offset,

        })
      }
    }

    override getWires(): Array<Wire> {
      const wires = [];

      for (const con of opts.connections) {
        const pin = this.node[con.conName] as Connection

        if (pin?.connectedTo) {
          if (con.vccToggle && !vccLines) {
            pin.connectedTo.skipped = true
          } else {
            wires.push(pin.connectedTo);
          }

        }




      }
      return wires
    }

    override getInOutComponent(id: string) {
      return this.connectorElements?.find(el => el.node.inC.id === id)
    }

    ngOnInit() {
    }

  }
  return SimpleUi
}