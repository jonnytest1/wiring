import {
    AmbientLight, Mesh, SphereGeometry, MeshStandardMaterial, Object3DEventMap,
    Scene as ThreeScene, Line,
    AxesHelper,
} from 'three';
import * as THREE from "three"
import type { NodeEl, NodeTemplate } from '../../wiring.component';
import { nodesSubject, type NodeWithPos } from './scene-data';
import { Wire } from '../../wirings/wire';
import { ParrallelWire } from '../../wirings/parrallel-wire';
import type { Indexable, IndexableStatic, Wiring } from '../../wirings/wiring.a';
import { ImageAsset } from './asset/image';
import { TransformedAsset } from './asset/transformed-asset';
import { TransformedText } from './asset/text';
import { LineMesh } from './asset/line-mesh';
import { Esp8x8Matrix } from './asset/model/3dMAtrix';
import { ResolvablePromise } from '../../../utils/resolvable-promise';


const modelList = [
    Esp8x8Matrix
] satisfies Array<Indexable>


const modelMap = Object.fromEntries(modelList.map(m => [m.typeName, m]))

export class GameScene extends ThreeScene {
    ball: Mesh<SphereGeometry, MeshStandardMaterial, Object3DEventMap>;

    wires: Set<Wire>;
    nodeComponent: Map<Wiring, Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], Object3DEventMap> | (TransformedAsset & Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], Object3DEventMap>)> = new Map();

    wireElements: Array<LineMesh> = []





    constructor(private nodes: NodeEl[]) {

        /**
         * {
            key: 'GameScene'
        }
         */
        super();

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


        nodesSubject
            .subscribe(async nodes => {

                this.wires = new Set<Wire>();

                for (const node of this.nodeComponent.values()) {
                    this.remove(node)
                }

                this.nodeComponent = new Map<Wiring, Mesh | (TransformedAsset & Mesh)>()
                const asyncList = []



                for (let node of nodes) {
                    const typeN = (node.node.constructor as unknown as Indexable).typeName

                    const ModelMesh = modelMap[typeN]
                    if (ModelMesh) {
                        const msh = new ModelMesh(node as NodeWithPos<never>)
                        this.add(msh)
                        this.nodeComponent.set(node.node, msh)
                        //msh.init(this)
                        if ("ready" in msh && msh.ready instanceof ResolvablePromise) {
                            asyncList.push(msh.ready.prRef)
                        }





                    } else {
                        const icon = (node.node.uiNode.constructor as NodeTemplate).templateIcon

                        if (icon.startsWith("asset:")) {
                            const msh = new ImageAsset(node)
                            this.add(msh)
                            this.nodeComponent.set(node.node, msh)

                            asyncList.push(msh.ready.prRef)

                        } else {
                            const textMesh1 = new TransformedText(icon) // new THREE.Mesh(text.geometry, materials);
                            textMesh1.position.set(node.position.x / 100, 20, node.position.y / 100)
                            //textMesh1.rotateZ(Math.PI)
                            this.add(textMesh1)
                            this.nodeComponent.set(node.node, textMesh1)
                        }
                    }
                    const nodeWires = node.node.uiNode.getWires()
                    nodeWires.forEach(wire => {
                        if (wire instanceof ParrallelWire) {
                            for (const inWire of wire.inC) {
                                for (const outC of wire.outC) {
                                    const tWire = new Wire();
                                    tWire.inC = inWire;
                                    tWire.outC = outC;
                                    this.wires.add(tWire);
                                }
                            }
                        } else {
                            this.wires.add(wire);
                        }
                    });

                }

                await Promise.all(asyncList)
                this.drawWires()
            })
    }


    drawWires() {

        for (const wireEl of this.wireElements) {
            this.remove(wireEl)
        }
        this.wireElements.length = 0

        this.wires.forEach((wire, i, i2) => {

            const connectionParent = wire.inC?.parent;
            const relativeFrom = connectionParent?.uiNode?.getInOutComponent(wire.inC?.id)?.getRelativeOutVector();
            const nodeComp = this.nodeComponent.get(connectionParent)

            let relativeVector = new THREE.Vector3(relativeFrom.x / 10, 1, relativeFrom.y / 10);
            if ("transformRelative" in nodeComp) {
                relativeVector = nodeComp.transformRelative(relativeVector)
            }

            const wireFrom = nodeComp.position.clone().add(relativeVector)


            const toParent = wire.outC?.parent;
            const relativeTo = toParent?.uiNode?.getInOutComponent(wire.outC?.id)?.getRelativeInVector();
            const toComp = this.nodeComponent.get(toParent)

            let relativeToVector = new THREE.Vector3(relativeTo.x / 10, 1, relativeTo.y / 10);
            if ("transformRelative" in toComp) {
                relativeToVector = toComp.transformRelative(relativeToVector)
            }


            const wireTo = toComp.position.clone().add(relativeToVector)
            if (!wireTo || !relativeFrom) {
                return undefined;
            }
            const line = new LineMesh(wireFrom, wireTo)
            this.add(line)
            this.wireElements.push(line)
        })
    }



}