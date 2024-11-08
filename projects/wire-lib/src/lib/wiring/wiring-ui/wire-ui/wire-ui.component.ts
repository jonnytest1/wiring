import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { BindingBoolean } from '../../../utils/type-checker';
import { BoundingBox } from '../../util/bounding-box';
import { Vector2 } from '../../util/vector';
import { WiringDataService } from '../../wiring.service';
import { Wire } from '../../wirings/wire';

@Component({
  selector: 'app-wire-ui',
  templateUrl: './wire-ui.component.html',
  styleUrls: ['./wire-ui.component.less']
})
export class WireUiComponent implements OnInit {

  @Input()
  positions: Array<Vector2>;


  @Input()
  wire: Wire;

  verticalBoxes: Array<BoundingBox>;
  horizontalBoxes: Array<BoundingBox>;

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

    let boundingBox = new BoundingBox(Vector2.ZERO, Vector2.ZERO)

    for (let vecI = 0; vecI < this.positions.length; vecI++) {

      for (let vecJ = vecI + 1; vecJ < this.positions.length; vecJ++) {
        const combinationBox = new BoundingBox(this.positions[vecI], this.positions[vecJ])

        if (combinationBox.diagonal().length() > boundingBox.diagonal().length()) {
          boundingBox = combinationBox
        }

      }
    }

    const direction = boundingBox.diagonal();
    const isFalling = direction.y > 0;
    const isRight = direction.x > 0;

    let left: number;
    let right: number;
    let horizonaly;

    const width = 2;
    if (!isRight) {
      left = boundingBox.getRight();
      right = boundingBox.getLeft();
    } else {
      left = boundingBox.getLeft();
      right = boundingBox.getRight();
    }

    if (isFalling != isRight) {
      horizonaly = boundingBox.bottomRight.y;
    } else {
      horizonaly = boundingBox.topLeft.y;
    }
    if (isFalling) {
      this.dot = new Vector2(right, horizonaly);
    } else {
      this.dot = new Vector2(left, horizonaly);
    }

    let fromToDot = this.dot.subtract(boundingBox.topLeft);
    fromToDot = fromToDot.scaleTo(this.lineWidth + this.borderWidth * 2);
    const fromLine = new BoundingBox(boundingBox.topLeft.added(fromToDot), this.dot)
      .toRectangle()
      .withMargin(new Vector2(width, width));


    let toVtoDot = this.dot.subtract(boundingBox.bottomRight);
    toVtoDot = toVtoDot.scaleTo(this.lineWidth + this.borderWidth * 2);

    const toLine = new BoundingBox(
      boundingBox.bottomRight.added(toVtoDot), this.dot
    )
      .toRectangle()
      .withMargin(new Vector2(width, width));

    this.horizontalBoxes = [toLine];
    this.verticalBoxes = [fromLine]; //


    const remainingConnecitons = this.positions.filter(p => p !== boundingBox.topLeft && p !== boundingBox.bottomRight)

    for (const con of remainingConnecitons) {

      const distanceHorizontal = con.subtract(new Vector2(con.x, this.dot.y))
      const distanceVertical = con.subtract(new Vector2(this.dot.x, con.y))

      let addVertical = distanceHorizontal.length() < distanceVertical.length()

      if (addVertical) {
        if (toLine.toRectangle().getRight() < con.x || toLine.toRectangle().getLeft() > con.x) {
          addVertical = false
        }

      } else {
        if (fromLine.toRectangle().getBottom() < con.y || fromLine.toRectangle().getTop() > con.y) {
          addVertical = true
        }
      }

      if (addVertical) {
        const additinoalBox = new BoundingBox(con, new Vector2(con.x, this.dot.y))
          .toRectangle()
          .withMargin(new Vector2(width, width));

        this.verticalBoxes.push(additinoalBox)
      } else {
        const additinoalBox = new BoundingBox(con, new Vector2(this.dot.x, con.y))
          .toRectangle()
          .withMargin(new Vector2(width, width));

        this.horizontalBoxes.push(additinoalBox)
      }
    }
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
      debugger

      /*
      const parrallelWireStart = new ParrallelWire();
      parrallelWireStart.newInC(previousWire.inC);
      parrallelWireStart.newOutC(previousWire.outC);



      const parrallelWireEnd = new ParrallelWire();
      parrallelWireEnd.newInC(currentWire.inC);
      parrallelWireEnd.newOutC(currentWire.outC);
      parrallelWireStart.newOutC().connectTo(parrallelWireEnd.newInC());*/
    } else if (this.data.dragConnection) {
      debugger
      /*const parrallelWireEnd = new ParrallelWire();
      parrallelWireEnd.newInC(currentWire.inC);
      parrallelWireEnd.newInC(this.data.dragConnection);
      parrallelWireEnd.newOutC(currentWire.outC);*/
    }
  }
}
