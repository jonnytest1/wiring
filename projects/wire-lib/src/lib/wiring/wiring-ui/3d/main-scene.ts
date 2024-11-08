import {
    AmbientLight, Mesh, SphereGeometry, MeshStandardMaterial, Object3DEventMap,
    Scene as ThreeScene, Line,
    AxesHelper,
    SpotLight,
    SpotLightHelper,
    BoxGeometry,
    Color,
} from 'three';
import * as THREE from "three"
import type { NodeEl, NodeTemplate } from '../../wiring.component';
import { nodesSubject, type NodeWithPos } from './scene-data';
import { Wire } from '../../wirings/wire'
import type { Indexable, IndexableStatic, Wiring } from '../../wirings/wiring.a';
import { ImageAsset } from './asset/image';
import { TransformedAsset } from './asset/transformed-asset';
import { TransformedText } from './asset/text';
import { LineMesh } from './asset/line-mesh';
import { Esp8x8Matrix } from './asset/model/3dMAtrix';
import { ResolvablePromise } from '../../../utils/resolvable-promise';
import { Battery3d } from './asset/model/3dbattery';
import { InteropWorld } from './gravity';
import type { SharedEventMesh } from './event';
import type { Router } from '@angular/router';


const modelList = [
    Esp8x8Matrix,
    Battery3d
] satisfies Array<Indexable>


const modelMap = Object.fromEntries(modelList.map(m => [m.typeName, m]))

export interface Context {
    router: Router
}

export class GameScene extends ThreeScene {
    ball: Mesh<SphereGeometry, MeshStandardMaterial, Object3DEventMap>;

    wires: Set<Wire>;
    nodeComponent: Map<Wiring, Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], Object3DEventMap> | (TransformedAsset & Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], Object3DEventMap>)> = new Map();

    wireElements: Array<LineMesh> = []
    gravity: InteropWorld;
    context: Context;





    constructor(private nodes: NodeEl[]) {

        /**
         * {
            key: 'GameScene'
        }
         */
        super();
        this.gravity = new InteropWorld(this)
        this.add(this.gravity)
        //this.background.copy(THREE.Color(THREE.Color.NAMES.orange))
        this.background = new THREE.Color(0xa3a3a3);
        this.create()


    }




    create() {

        const diameter = 30;

        this.add(new AxesHelper(200));



        const yAxis = new Line()
        this.add(yAxis)

        for (let i = 0; i < 100; i++) {
            // const point =

        }


        /* const g = new BoxGeometry(10, 5, 1);
         const m = new MeshBasicMaterial({
             map: new TextureLoader()
                 .load("assets/icons/pipico.png")
         })
         const msh = new Mesh(g, m)
         msh.position.set(20, 20, 20)
         this.threeScene.add(msh)
         */

        //set(scene.game.config.width as number / 2, this.startY, GameOptions.ballStartingStep * -GameOptions.stepSize.z);


        //threeScene.add(this.ball)
        const nodeYLEvel = 8

        nodesSubject
            .subscribe(async nodes => {

                this.wires = new Set<Wire>();

                for (const node of this.nodeComponent.values()) {
                    this.remove(node)
                    this.gravity.removeObject(node)
                }

                this.nodeComponent = new Map<Wiring, Mesh | (TransformedAsset & Mesh)>()
                const asyncList = []


                for (let node of nodes) {
                    let nodeMesh: SharedEventMesh
                    const typeN = (node.node.constructor as unknown as Indexable).typeName

                    const ModelMesh = modelMap[typeN]
                    if (ModelMesh) {
                        nodeMesh = new ModelMesh(node as NodeWithPos<never>)
                        //msh.init(this)
                        if ("ready" in nodeMesh && nodeMesh.ready instanceof ResolvablePromise) {
                            asyncList.push(nodeMesh.ready.prRef)
                        }
                    } else {
                        const icon = (node.node.uiNode.constructor as NodeTemplate).templateIcon

                        if (icon.startsWith("asset:")) {
                            const imgMesh = new ImageAsset(node)
                            nodeMesh = imgMesh
                            asyncList.push(imgMesh.ready.prRef)
                        } else {
                            nodeMesh = new TransformedText(icon) // new THREE.Mesh(text.geometry, materials);
                            //textMesh1.rotateZ(Math.PI)
                        }
                    }
                    nodeMesh.castShadow = true
                    nodeMesh.position.set(node.position.x / 10, nodeYLEvel, node.position.y / 10)
                    this.gravity.addGravityObject(nodeMesh, 1)

                    this.add(nodeMesh)
                    this.nodeComponent.set(node.node, nodeMesh)

                    const nodeWires = node.node.uiNode.getWires()
                    nodeWires.forEach(wire => {
                        this.wires.add(wire);

                    });

                }

                await Promise.all(asyncList)
                this.drawWires()
            })



        const spotLight: SpotLight = new SpotLight(new Color("white"), 2, 0, 0.4, 0.5, 0.1);
        spotLight.position.set(10, 200, 10);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.camera.near = 1;
        spotLight.shadow.camera.far = 10000;
        spotLight.shadow.camera.fov = 80;
        spotLight.target.position.copy(spotLight.position.clone().sub(new THREE.Vector3(0, 1, 0)));


        //this.add(new SpotLightHelper(spotLight))
        this.add(spotLight);
        this.add(spotLight.target);


        const floor = new Mesh(new BoxGeometry(200, 1, 200), new MeshStandardMaterial({
            color: "white"
        })) as SharedEventMesh
        this.gravity.addGravityObject(floor, undefined, InteropWorld.STATIC)
        floor.receiveShadow = true
        floor.position.set(50, -1, 50)
        this.add(floor)

    }


    drawWires() {

        for (const wireEl of this.wireElements) {
            this.remove(wireEl)
        }
        this.wireElements.length = 0

        this.wires.forEach((wire, i, i2) => {
            debugger
            /*const connectionParent = wire.inC?.parent;
            const relativeFrom = connectionParent?.uiNode?.getInOutComponent(wire.inC?.id)?.getRelativeOutVector();
            if (!relativeFrom) {
                return
            }
            const nodeComp = this.nodeComponent.get(connectionParent)

            let relativeVector = new THREE.Vector3(relativeFrom.x / 10, 0.1, relativeFrom.y / 10);
            if ("transformRelative" in nodeComp) {
                relativeVector = nodeComp.transformRelative(relativeVector)
            }

            const wireFrom = nodeComp.position.clone().add(relativeVector)


            const toParent = wire.outC?.parent;
            const relativeTo = toParent?.uiNode?.getInOutComponent(wire.outC?.id)?.getRelativeInVector();
            if (!relativeTo) {
                return
            }
            const toComp = this.nodeComponent.get(toParent)

            let relativeToVector = new THREE.Vector3(relativeTo.x / 10, 0.1, relativeTo.y / 10);
            if ("transformRelative" in toComp) {
                relativeToVector = toComp.transformRelative(relativeToVector)
            }


            const wireTo = toComp.position.clone().add(relativeToVector)
            if (!wireTo || !relativeFrom) {
                return undefined;
            }
            const line = new LineMesh(wireFrom, wireTo)
            this.add(line)
            this.wireElements.push(line)*/
        })
    }



}