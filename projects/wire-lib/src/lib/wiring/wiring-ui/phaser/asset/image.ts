import { BoxGeometry, Mesh, MeshBasicMaterial, TextureLoader, Vector3 } from 'three';
import type { Wiring } from '../../../wirings/wiring.a';
import type { Collection } from '../../../wirings/collection';
import type { NodeWithPos } from '../scene-data';
import type { NodeTemplate } from '../../../wiring.component';
import { ResolvablePromise } from '../../../../utils/resolvable-promise';
import { TransformedAsset } from './transformed-asset';

export class ImageAsset extends Mesh implements TransformedAsset {


    private imageScale = 100

    private topLeftVec: Vector3

    ready = new ResolvablePromise<true>()

    constructor(node: NodeWithPos) {
        super()


        const icon = (node.node.uiNode.constructor as NodeTemplate).templateIcon
        const assetSrc = icon.split("asset:")[1];
        let img = new Image()
        img.src = assetSrc
        this.position.set(node.position.x / 10, 20, node.position.y / 10)

        img.onload = () => {
            const g = new BoxGeometry(img.width / this.imageScale, img.height / this.imageScale, 1);
            this.topLeftVec = new Vector3(img.width / this.imageScale, 1, img.height / this.imageScale).divideScalar(2)
            const m = new MeshBasicMaterial({
                map: new TextureLoader()
                    .load(assetSrc)
            })
            this.geometry = g
            this.material = m
            this.rotateX(Math.PI / 2)
            this.rotateZ(Math.PI)
            this.updateMorphTargets()
            this.ready.resolve(true)
        }
    }


    transformRelative(relativeVector: Vector3) {
        return new Vector3(relativeVector.x / 2.5, relativeVector.y, relativeVector.z / 2.5).sub(this.topLeftVec)
    }

}