
import { ComponentRef, DestroyRef, Directive, inject, Injector, TemplateRef, ViewChild } from '@angular/core';

import type { Vector2 } from '../util/vector';
import type { Collection } from '../wirings/collection';
import type { Wire } from '../wirings/wire';
import { InOutComponent } from './in-out/in-out.component';
import type { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { ParrallelWire } from '../wirings/parrallel-wire';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, takeUntil, takeWhile, timer } from 'rxjs';
import type { WireQueryParams } from '../wire-query-params';
import { TypedEventEmitter } from '../util/typed-event-emitter';

@Directive()
export abstract class UINode<T extends Collection = Collection> extends TypedEventEmitter<{ afterViewInit: void }> {

  private position: Vector2;

  private rotation: number

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
    node.uiNode = this;


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

  getWires(): Array<Wire | ParrallelWire> {
    return this.getWiresforNode(this.node);
  }

  getWiresforNode(col: Collection) {
    const wires: Array<Wire | ParrallelWire> = [];
    if (col?.inC?.connectedTo) {
      wires.push(col?.inC?.connectedTo);
    }
    if (col?.outC?.connectedTo) {
      wires.push(col?.outC?.connectedTo);
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


  toJSON() {
    return {
      ...this.getPosition(),
      rotation: this.rotation
    }
  }

}
