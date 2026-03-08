import struct
import json
import sys
import os

def parse_glb(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'rb') as f:
        # Read header
        header = f.read(12)
        if len(header) < 12:
            print("File too small")
            return
        magic, version, length = struct.unpack('<4sII', header)
        if magic != b'glTF':
            print("Not a GLB file")
            return
            
        # Read JSON chunk header
        chunk_header = f.read(8)
        if len(chunk_header) < 8:
            print("File too small")
            return
        chunk_length, chunk_type = struct.unpack('<I4s', chunk_header)
        if chunk_type != b'JSON':
            print("First chunk is not JSON")
            return
            
        json_data = f.read(chunk_length)
        gltf = json.loads(json_data.decode('utf-8'))
        
        print(f"=== File: {file_path} ===")
        print("Meshes:")
        if 'meshes' in gltf:
            for i, mesh in enumerate(gltf['meshes']):
                print(f"  Mesh {i}: {mesh.get('name', 'Unnamed')}")
        else:
            print("  No meshes found")
            
        print("Nodes:")
        if 'nodes' in gltf:
            for i, node in enumerate(gltf['nodes']):
                mesh_str = f", Mesh index: {node['mesh']}" if 'mesh' in node else ""
                skin_str = f", Skin index: {node['skin']}" if 'skin' in node else ""
                name_str = node.get('name', 'Unnamed')
                print(f"  Node {i}: {name_str}{mesh_str}{skin_str}")
        else:
             print("  No nodes found")
             
        print("Skins:")
        if 'skins' in gltf:
            for i, skin in enumerate(gltf['skins']):
                name_str = skin.get('name', 'Unnamed')
                joints = len(skin.get('joints', []))
                print(f"  Skin {i}: {name_str}, Joints: {joints}")
        else:
            print("  No skins found")

if __name__ == '__main__':
    parse_glb(sys.argv[1])
