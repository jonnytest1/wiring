
import { DestroyRef, Directive, inject, InjectionToken, Injector, TemplateRef, ViewChild } from '@angular/core';

import type { Vector2 } from '../util/vector';
import { Collection } from '../wirings/collection';
import type { Wire } from '../wirings/wire';
import { InOutComponent } from './in-out/in-out.component';
import type { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { takeWhile } from 'rxjs';
import type { WireQueryParams } from '../wire-query-params';
import { TypedEventEmitter } from '../util/typed-event-emitter';
import type { Wiring } from '../wirings/wiring.a';


export const existingNodeToken = new InjectionToken<Collection>("existing node");


@Directive()
export abstract class UINode<T extends Wiring = Wiring> extends TypedEventEmitter<{ afterViewInit: void }> {

  position: Vector2;

  rotation: number

  @ViewChild('options')
  public optionsTemplate?: TemplateRef<any>;


  @ViewChild(InOutComponent)
  public inOutComponent?: InOutComponent;


  snackbarRef: MatSnackBarRef<any>;

  activeRoute = inject(ActivatedRoute)


  destroy = inject(DestroyRef)
  injector = inject(Injector)

  router = inject(Router)
  alive: boolean;

  constructor(public node: T, inj?) {
    super()
    this.node.uiNode = this;


    this.alive = true
    this.destroy.onDestroy(() => {
      this.alive = false
    })
  }

  ngAfterViewInit(): "do not override use event emitter" {

    this.emit("afterViewInit", undefined)

    this.activeRoute.queryParams
      .pipe(

        takeWhile(() => this.alive)
      )
      .subscribe((params: WireQueryParams) => {
        if (params.active && params.active === this.node.nodeUuid) {
          if (!this.optionsTemplate) {
            return;
          }
          const snackbar = this.injector.get(MatSnackBar);
          this.snackbarRef = snackbar.openFromTemplate(this.optionsTemplate);

        } else {
          this.snackbarRef?.dismiss()
        }


      })
    return "do not override use event emitter"
  }

  initNodes() {

  }

  openSnackbar() {
    this.router.navigate([], {
      queryParams: {
        active: this.node.nodeUuid
      },
      queryParamsHandling: "merge"
    })
  }

  getWires(): Array<Wire> {
    return this.getWiresforNode(this.node);
  }

  getWiresforNode(col: Wiring) {
    const wires: Array<Wire> = [];
    if (col instanceof Collection) {
      if (col?.inC?.connectedTo) {
        wires.push(col?.inC?.connectedTo);
      }
      if (col?.outC?.connectedTo) {
        wires.push(col?.outC?.connectedTo);
      }
    }

    return wires;
  }

  getInOutComponent(wireId: string): InOutComponent {
    return this.inOutComponent;
  }

  setRotation(rot: number) {
    this.rotation = rot;
  }
  getRotation() {
    return this.rotation;
  }

  setPosition(vector: Vector2) {
    this.position = vector;
  }


  getPosition(): Vector2 {
    return this.position;
  }



  abstract getIcon(): string;

  abstract factory(): (new (...args) => T)


  toJSON() {
    return {
      ...this.getPosition(),
      rotation: this.rotation ?? 0
    }
  }



  static of<T extends Wiring>(cnstructor: (new (...args) => T)) {
    abstract class TempScoped extends UINode<T> {
      override factory(): new (...args: any[]) => T {
        return cnstructor
      }
    }
    return TempScoped
  }
}
