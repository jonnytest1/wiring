import { BehaviorSubject } from 'rxjs';
import type { IndexableStatic, Wiring } from '../../wirings/wiring.a';
import type { Collection } from '../../wirings/collection';
import type { Vector2 } from '../../util/vector';

export interface NodeWithPos<T extends Wiring & Collection = Wiring & Collection> {
    node: T;
    position: Vector2;
}

export const nodesSubject = new BehaviorSubject<Array<NodeWithPos>>([])