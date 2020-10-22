# glTF Inspector
This tool is intended to aid in debugging complex glTF files, making them more human readable. 

The production tool is available at: http://gltf.xyz

Drag and drop your glTF and it's associated assets to start exploring it. All data is kept local to your computer and nothing is ever sent back to a server.

## Node Browser
Displays all the items in the gltf `nodes` array, with their indices, names, and the total byte size their geometry occupies (note: if geometry instancing is used this byte size will total > 100% of the file size). Indentation indicates node parent/child relationships.

Clicking on a node in the list will load it into the Node Information Panel.

### Node Information
The node information panel will display an isolated 3d representation of the node at the top. To the bottom left you will find the raw JSON contents of the node, and to the right you will find a prettified panel displaying node properties and giving links to assets referenced by the node.

## Meshes Browser
Displays all items in the gltf `meshes` array, with their indices, names, the number of times they are referenced by nodes, and the byte size of their geometry.

Clicking on a mesh will load it into the Mesh Information Panel.

### Mesh Information
The top of the mesh information panel will display the name and size of the mesh, and a count of nodes which reference this mesh. Clicking on the node reference count will return you to the Node Browser filtered to only show the nodes which reference this mesh. An insolated 3d representation of the mesh is displayed below. To the bottom left you will find the raw JSON contents ofthe mesh, and to the right you will find a prettified panel displaying mesh properties, and giving links to assets referenced by the mesh. For all binary data referenced, clicking the "View" link will display the numerical information (such as vertices or indices) in a prettified format.

## Materials Browser
Displays all the items in the gltf `materials` array, with their indices, names, and the number of times they are referenced by meshes.

Clicking on a material will load it into the Material Information Panel.

### Material Information
The material information panel will display both mesh references and node references to this material, clicking on their counts will return to their respective Browser tab filtered to only include referencing items. Additionally, the JSON contents of the material object are shown.
