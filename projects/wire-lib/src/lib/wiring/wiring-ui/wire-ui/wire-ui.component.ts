import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { BindingBoolean } from '../../../utils/type-checker';
import { BoundingBox } from '../../util/bounding-box';
import { Vector2 } from '../../util/vector';
import { WiringDataService } from '../../wiring.service';
import { ParrallelWire } from '../../wirings/parrallel-wire';
import { Wire } from '../../wirings/wire';

@Component({
  selector: 'app-wire-ui',
  templateUrl: './wire-ui.component.html',
  styleUrls: ['./wire-ui.component.less']
})
export class WireUiComponent implements OnInit {

  @Input()
  fromVector: Vector2;

  @Input()
  toVector: Vector2;

  @Input()
  wire: Wire;

  verticalBox: BoundingBox;
  horizontalBox: BoundingBox;

  highlighted = false;

  @Input()
  below: BindingBoolean;

  dot: Vector2;
  lineWidth = 2;

  borderWidth = 2;


  tempConnectorPos: Vector2;

  constructor(public data: WiringDataService) { }

  mouseEnter(event: MouseEvent) {
    this.highlighted = true;
    this.tempConnectorPos = new Vector2(event);
  }

  ngOnInit() {
    this.calculateWires();
  }

  ngOnChanges() {
    this.calculateWires();
  }

  calculateWires() {
    const fromVector = this.fromVector;
    const fromBox = new BoundingBox(
      fromVector.added(-this.lineWidth * 2, -this.lineWidth * 2),
      fromVector.added(this.lineWidth * 2, this.lineWidth * 2)
    );

    const toVector = this.toVector;



    const wireBox = new BoundingBox(fromVector, toVector);
    const direction = wireBox.diagonal();
    const isFalling = direction.y > 0;
    const isRight = direction.x > 0;

    let left: number;
    let right: number;
    let horizonaly;

    const width = 2;
    if (!isRight) {
      left = wireBox.getRight();
      right = wireBox.getLeft();
    } else {
      left = wireBox.getLeft();
      right = wireBox.getRight();
    }

    if (isFalling != isRight) {
      horizonaly = toVector.y;
    } else {
      horizonaly = fromVector.y;
    }
    if (isFalling) {
      this.dot = new Vector2(right, horizonaly);
    } else {
      this.dot = new Vector2(left, horizonaly);
    }

    let fromToDot = this.dot.subtract(fromVector);
    fromToDot = fromToDot.scaleTo(this.lineWidth + this.borderWidth * 2);
    const fromLine = new BoundingBox(fromVector.added(fromToDot), this.dot)
      .toRectangle()
      .withMargin(new Vector2(width, width));


    let toVtoDot = this.dot.subtract(toVector);
    toVtoDot = toVtoDot.scaleTo(this.lineWidth + this.borderWidth * 2);

    const toLine = new BoundingBox(
      toVector.added(toVtoDot), this.dot
    )
      .toRectangle()
      .withMargin(new Vector2(width, width));

    this.horizontalBox = toLine;
    this.verticalBox = fromLine; //




  }

  clearTemp() {
    console.log('drag end');
    this.data.editingWire = undefined;
  }

  tempConnectDragStart(event: MouseEvent) {
    console.log('drag start');
    this.highlighted = false;
    if (!this.data.editingWire) {
      this.data.editingWire = {
        component: this,
        position: new Vector2(event).dividedBy(10).rounded().multipliedBy(10),
        toPosition: new Vector2(event).dividedBy(10).rounded().multipliedBy(10)
      };
    } else {
      this.data.editingWire = undefined;
    }
    this.tempConnectorPos = undefined;
  }

  getTempConnector() {
    if (this.tempConnectorPos) {
      return this.tempConnectorPos;
    }
    if (this.data.editingWire?.component === this) {
      return this.data.editingWire?.position;
    }
    return undefined;
  }

  createParrallelWire(event: Event) {
    const currentWire = this.wire;
    if (this.data.editingWire) {

      const previousWire = this.data.editingWire.component.wire;

      const parrallelWireStart = new ParrallelWire();
      parrallelWireStart.newInC(previousWire.inC);
      parrallelWireStart.newOutC(previousWire.outC);



      const parrallelWireEnd = new ParrallelWire();
      parrallelWireEnd.newInC(currentWire.inC);
      parrallelWireEnd.newOutC(currentWire.outC);
      parrallelWireStart.newOutC().connectTo(parrallelWireEnd.newInC());
    } else if (this.data.dragConnection) {
      const parrallelWireEnd = new ParrallelWire();
      parrallelWireEnd.newInC(currentWire.inC);
      parrallelWireEnd.newInC(this.data.dragConnection);
      parrallelWireEnd.newOutC(currentWire.outC);
    }
  }
}
