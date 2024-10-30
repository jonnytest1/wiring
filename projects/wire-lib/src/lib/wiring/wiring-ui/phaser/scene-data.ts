import { BehaviorSubject } from 'rxjs';
import type { Wiring } from '../../wirings/wiring.a';
import type { Collection } from '../../wirings/collection';
import type { Vector2 } from '../../util/vector';

export interface NodeWithPos {
    node: Wiring & Collection;
    position: Vector2;
}

export const nodesSubject = new BehaviorSubject<Array<NodeWithPos>>([])