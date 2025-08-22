import { Box3, BoxGeometry, Color, Mesh, Vector3, type Intersection, type MeshStandardMaterial, type Object3D, MeshLambertMaterial, BufferGeometry, Group, AxesHelper } from 'three';
import type { ImageEventMap } from '../image';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Wire } from '../../../../wirings/wire';
import { Connection } from '../../../../wirings/connection';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { InteractionGroup } from '../../util/interaction-group';
import { positionable } from '../../util/positionable';
import { assignCollisionMesh, cannonSymbol } from '../../util/collision-mesh';
import { v4 } from 'uuid';
import type { SharedEvents } from '../../event';
import { CollisionHelper } from '../../util/collisionhelper';
import { getSymbolData, implementsSymbol } from '../../util/typed-symbol';
export class Wired3dModel {



    wireMap: Record<string, Wire> = {}
    connectorMap: Record<string, Connection> = {}
    static connectorMeshMap: Map<Connection, Mesh> = new Map()
    object: InteractionGroup & { geometry?: BoxGeometry };


    static highLigthedWires = new Set<Connection>()



    collisionhelper = new CollisionHelper()

    constructor(gltf: GLTF, intersection: Intersection) {


        this.object = positionable(new InteractionGroup())

        //this.object = gltf.scene.children[0]
        // this.object.scale.divideScalar(10)

        this.object.userData["model"] = this
        this.object.onSelected = () => {

        }

        const bbox = new Box3().setFromObject(gltf.scene);
        const center = bbox.getCenter(new Vector3());
        const offset = center.negate()


        this.object.position.copy(intersection.point.add(new Vector3(0, 10, 0)))
        this.object.castShadow = true
        this.object.receiveShadow = true

        gltf.scene.updateMatrix()

        const boundingBoxPre = new Box3().setFromObject(gltf.scene.children[0])
        const meshes = gltf.scene.getObjectsByProperty("type", "Mesh") as Array<Mesh>;
        let currentGEmoetry: BufferGeometry

        let clonesMEshes: Array<Mesh> = []

        for (let mesh of meshes) {
            const clonedMEssh = mesh.clone()
            clonedMEssh.position.add(offset);
            //mesh.position.copy(this.object.position)
            clonesMEshes.push(clonedMEssh)

            const match = clonedMEssh.name.toLowerCase().match(/connection_(?<pinId>\d+)_w(?<wireid>[\da-zA-Z]+)$/)
            const pinId = match?.groups?.["pinId"];

            const pinMatch = clonedMEssh.name.toLowerCase().match(/pin_(?<pinId>\d+)_w(?<wireid>[\da-zA-Z]+)$/)
            if (pinId) {
                const wireId = match?.groups?.["wireid"];
                const uniquePinId = `w${wireId}p${pinId}`
                clonedMEssh.userData["con"] = uniquePinId
                const wire = this.wireMap[wireId] ??= new Wire()
                this.connectorMap[uniquePinId] = wire.createConnectionLink(`wireconnection3dgenericw_${wireId}_${uniquePinId}`)
                Wired3dModel.connectorMeshMap.set(this.connectorMap[uniquePinId], clonedMEssh)

                const interactionGRoup = new InteractionGroup()
                interactionGRoup.add(clonedMEssh)
                this.collisionhelper.add(clonedMEssh)

                interactionGRoup.onMouseOver = (ctx) => {
                    ctx.domEl.style.cursor = "grab"
                    ctx.stopPropagation()

                }

                interactionGRoup.onShortClick = () => {
                    Wired3dModel.highLigthedWires = new Set()
                    this.highlightWire(wire);
                }

                interactionGRoup.onMouseDown = (ctx) => {

                    ctx.blockPan()
                    ctx.stopPropagation()
                    ctx.captureDrag({
                        wire,
                    })

                }


                interactionGRoup.onDrop = (evt => {

                    const w = evt.data.wire as Wire
                    w.connect(this.connectorMap[uniquePinId])

                    Wired3dModel.highLigthedWires = new Set()
                    this.highlightWire(w)
                })
                interactionGRoup.canDrop = (evt => {

                    if (evt.data?.wire === wire) {
                        return
                    }
                    evt.domEl.style.cursor = "zoom-in"
                    return true
                })

                assignCollisionMesh(clonedMEssh, {
                    collisionGroup: 1,
                    onCollide: () => {
                        debugger
                    },
                    data: {
                        wire: wire
                    }
                })

                this.object.add(interactionGRoup)
            } else if (pinMatch) {
                mesh.removeFromParent()
                clonedMEssh.userData["pin"] = clonedMEssh.name

                const wire = new Wire()
                const connection = wire.createConnectionLink("pin from model");
                Wired3dModel.connectorMeshMap.set(connection, clonedMEssh)


                assignCollisionMesh(clonedMEssh, {
                    collisionGroup: 2,
                    data: {
                        wire
                    },
                    onCollide: (evt) => {
                        const targetWire = evt.other.data.wire as Wire


                        wire.connect(targetWire.createConnectionLink("wireconnection3dgeneric"))

                        this.highlightWire(wire)
                    }

                })
                this.object.add(clonedMEssh)
                this.collisionhelper.add(clonedMEssh)
            } else {

                this.object.add(clonedMEssh)
            }
            const mat = clonedMEssh.material as MeshStandardMaterial

            clonedMEssh.material = new MeshLambertMaterial({ color: mat.color.clone() })

            clonedMEssh.castShadow = true
            clonedMEssh.receiveShadow = true
        }

        const boundingBox = new Box3().setFromObject(gltf.scene.children[0])

        gltf.scene.clear()

        for (const m of clonesMEshes) {
            m.position.add(boundingBoxPre.min.clone().sub(boundingBox.min).divideScalar(2))
        }


        //this.object.geometry = currentGEmoetry
        const dimensions = new Vector3().subVectors(boundingBox.max, boundingBox.min);
        this.object.geometry = new BoxGeometry(dimensions.x, dimensions.y, dimensions.z)
        this.object.updateMatrix()

        this.object.onCollsion = (e) => {

            const wireMOdel1 = e.group1.userData['model'] as Wired3dModel
            const wireMOdel2 = e.group2.userData['model'] as Wired3dModel

            e.setHandled()

            if (!wireMOdel1 || !wireMOdel2) {
                return
            }


            const matches = wireMOdel1.collisionhelper.intersect(wireMOdel2.collisionhelper);


            for (const match of matches) {

                const symbol = getSymbolData(match.a, cannonSymbol)
                const symbolb = getSymbolData(match.b, cannonSymbol)

                let handled = false
                symbol.onCollide({
                    other: symbolb,
                    handled() {
                        handled = true
                    },
                })
                if (!handled) {
                    symbolb.onCollide({
                        other: symbol,
                        handled() {

                        },
                    })
                }

            }
        }


    }

    private randomColor() {
        const col = Object.values(Color.NAMES)
        return col[Math.floor(Math.random() * col.length)];
    }
    private highlightWire(wire: Wire, color?: number) {
        if (!color) {
            Wired3dModel.highLigthedWires = new Set()

            color = this.randomColor()
        }
        wire.connections.forEach(con => {
            if (Wired3dModel.highLigthedWires.has(con)) {
                return
            }
            Wired3dModel.highLigthedWires.add(con)
            if (con.connectedTo) {
                this.highlightWire(con.connectedTo, color)
            }

            if (con.parent instanceof Wire) {
                this.highlightWire(con.parent, color)
            }

            const connectionMEsh = Wired3dModel.connectorMeshMap.get(con);
            if (connectionMEsh) {
                connectionMEsh.material = new MeshLambertMaterial({ color: color });

            } else {
                debugger
            }
        });
    }

    static load() {


    }
}