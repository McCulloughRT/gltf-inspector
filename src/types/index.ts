import { glTF, glNode } from "./gltf";

export interface IFilePackage {
    rootFile: File
    rootPath?: string
    fileMap: Map<string,File>
}

export interface IGLTFPackage extends IFilePackage {
    gltf: glTF
}

// export interface glRecursiveNode extends node {
//     selfIndex: number
//     children?: glRecursiveNode[]
// }