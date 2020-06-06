import { EXTENSIONS, BINARY_EXTENSION_HEADER_LENGTH, BINARY_EXTENSION_HEADER_MAGIC, BINARY_EXTENSION_CHUNK_TYPES } from "../constants"
import * as THREE from "three"

/* BINARY EXTENSION */
export class GLTFBinaryExtension {
    public name: string = EXTENSIONS.KHR_BINARY_GLTF
    public content: any
    public body: any
    public header: any

    constructor(data: any) {
        this.content = null
        this.body = null
        this.onLoad(data)
    }

    private onLoad = (data: any) => {
        const headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH)
        this.header = {
            magic: THREE.LoaderUtils.decodeText(new Uint8Array(data.slice(0,4))),
            version: headerView.getUint32(4, true),
            length: headerView.getUint32(8, true)
        }

        if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
            throw new Error('THREE.GLTFLoader: Unsupported glTF-Binary header.')
        } else if (this.header.version < 2.0) {
            throw new Error('THREE.GLTFLoader: Legacy binary file detected')
        }

        const chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH)
        let chunkIndex = 0

        while (chunkIndex < chunkView.byteLength) {
            const chunkLength = chunkView.getUint32(chunkIndex, true)
            chunkIndex += 4

            const chunkType = chunkView.getUint32(chunkIndex, true)
            chunkIndex += 4

            if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
                let contentArray = new Uint8Array(data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength)
                this.content = THREE.LoaderUtils.decodeText(contentArray)
            } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
                let byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex
                this.body = data.slice(byteOffset, byteOffset + chunkLength)
            }

            // Clients must ignore chunks with unknown types
            chunkIndex += chunkLength
        }

        if (this.content === null) {
            throw new Error('THREE.GLTFLoader: JSON content not found.')
        }
    }
}