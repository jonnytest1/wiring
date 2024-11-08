import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import type { Vector2 } from './util/vector';
import type { WireUiComponent } from './wiring-ui/wire-ui/wire-ui.component';
import type { Connection } from './wirings/connection';
import type { NodeEl } from './wiring.component';


@Injectable({ providedIn: 'root' })
export class WiringDataService {
  dragConnection?: Connection;

  //wires = new BehaviorSubject<Array<{ from: InOutComponent | Vector2, to: InOutComponent | Vector2 }>>([]);

  currentWire: { from: Vector2, to: Vector2 } = undefined;

  wireChange = new Subject<void>()

  editingWire: {
    component: WireUiComponent,
    position: Vector2
    toPosition: Vector2
  };
  draggedNode: NodeEl;


}