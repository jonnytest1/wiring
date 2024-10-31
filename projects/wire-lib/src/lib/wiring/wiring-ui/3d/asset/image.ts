import { BoxGeometry, Color, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, TextureLoader, Vector3 } from 'three';
import type { Wiring } from '../../../wirings/wiring.a';
import type { Collection } from '../../../wirings/collection';
import type { NodeWithPos } from '../scene-data';
import type { NodeTemplate } from '../../../wiring.component';
import { ResolvablePromise } from '../../../../utils/resolvable-promise';
import { TransformedAsset } from './transformed-asset';

export class ImageAsset extends Mesh implements TransformedAsset {


    private imageScale = 100

    protected topLeftVec: Vector3

    ready = new ResolvablePromise<true>()

    constructor(node: NodeWithPos) {
        const icon = (node.node.uiNode.constructor as NodeTemplate).templateIcon
        const assetSrc = icon.split("asset:")[1];
        const imageTexture = new TextureLoader()
            .load(assetSrc);
        const meshMaterial = new MeshStandardMaterial({
            map: imageTexture
        });
        super(new BoxGeometry(), meshMaterial)



        let img = new Image()
        img.src = assetSrc
        this.position.set(node.position.x / 10, 20, node.position.y / 10)

        img.onload = () => {
            this.topLeftVec = new Vector3(img.width / this.imageScale, 1, img.height / this.imageScale).divideScalar(2)
            this.geometry = new BoxGeometry(img.width / this.imageScale, img.height / this.imageScale, 1)
            this.rotateX(Math.PI / 2)
            this.rotateZ(Math.PI)
            this.updateMorphTargets()
            this.receiveShadow = true
            this.ready.resolve(true)

            meshMaterial.needsUpdate = true
            imageTexture.needsUpdate = true
            this.updateMatrix()
        }
    }


    transformRelative(relativeVector: Vector3) {
        return new Vector3(0.15 + relativeVector.x / 2.5, relativeVector.y, relativeVector.z / 2.5).sub(this.topLeftVec)
    }

}