import os
from xml.dom.minidom import Document
from .export_material import Material, DefaultMaterial, MaterialLibrary, export_image
from .data import DataEntry, DataType, DataReference, TextureEntry, write_generic_entry
from bpy_extras.io_utils import create_derived_objects, free_derived_objects
from . import tools
from . import meshtools


class Asset:
    id = ""
    meshes = None
    data = None
    sub_assets = None
    ref_assets = None
    matrix = None
    src = None
    configuration = None

    def __init__(self, id_=None, name=None, matrix=None, src=None):
        self.id = id_
        self.name = name
        self.matrix = matrix
        self.src = src
        self.meshes = []
        self.data = {}
        self.sub_assets = {}
        self.ref_assets = []


class AssetCollection:
    context = None
    name = ""
    assets = []

    def __init__(self, name, context, path, scene):
        self.name = name
        self.context = context
        self._path = path
        self._dir = os.path.dirname(path)
        self._scene = scene
        self.assets = []
        self.materials = {}

    def add_material(self, material):

        if material:
            converted = Material.from_blender_material(material, self.context, self._dir)
        else:
            converted = DefaultMaterial

        store = Material.evaluate_location(material, self.context.options.asset_material_selection)
        if not store:
            return None

        if store == "external":
            self.context.materials.add_material(converted)
            return "../shared-materials.xml#" + converted.id

        if converted.id not in self.materials:
            self.materials[converted.id] = converted
        return "#" + converted.id

    def add_asset(self, obj):
        model_configuration = None
        base_matrix = obj.matrix_basis.inverted()
        free, derived_objects = create_derived_objects(self._scene, obj)

        if derived_objects is None:
            return None, None

        asset = Asset(id_=tools.safe_query_selector_id(obj.data.name))

        if len(derived_objects) == 1:
            (derived_object, matrix) = derived_objects[0]
            asset.matrix = base_matrix * matrix
            model_configuration = self.add_asset_data(asset, derived_object)
        else:
            for derived_object, matrix in derived_objects:
                model_configuration = ModelConfiguration()
                if derived_object.type not in {'MESH', 'CURVE', 'SURFACE', 'FONT', 'META'}:
                    continue
                submodel_configuration = self.add_subasset(asset, derived_object, base_matrix * matrix)
                model_configuration.children.append(submodel_configuration)

        if free:
            free_derived_objects(obj)

        self.assets.append(asset)
        return asset.id, model_configuration

    def add_asset_data(self, asset, derived_object):
        model_configuration = ModelConfiguration()
        armature_info = None
        armature_object, warn = tools.get_armature_object(derived_object, self.context)

        if warn:
            self.context.warning(warn)

        if armature_object is not None:
            armature, armature_url = self.context.armatures.create_armature(armature_object)
            armature_info = {
                "vertex_groups": derived_object.vertex_groups,
                "global_inverse_matrix": (armature_object.matrix_world.inverted() * derived_object.matrix_world).inverted(),
                "offset_matrix": self.armature_offset_matrix(armature_object, derived_object),
                "bone_map": armature.bone_map,
                "src": "../armatures.xml#" + armature.id,
                "name": armature.id
            }
            armature_config = armature.get_config()
            if armature_config:
                model_configuration.children += armature_config

        try:
            apply_modifiers = armature_object is None
            mesh = derived_object.to_mesh(self._scene, apply_modifiers, 'RENDER', True, False)
        except:
            mesh = None

        if mesh:
            self.add_mesh_data(asset, mesh, armature_info)

        return model_configuration

    def add_subasset(self, parent_asset, derived_object, matrix):
        name = tools.safe_query_selector_id(derived_object.name)

        if name in parent_asset.sub_assets:
            ref_asset = Asset(src="#" + name, matrix=matrix)
            parent_asset.ref_assets.append(ref_asset)
            return None

        sub_asset = Asset(id_=name, matrix=matrix.copy())
        model_configuration = self.add_asset_data(sub_asset, derived_object)

        parent_asset.sub_assets[name] = sub_asset
        return model_configuration

    def armature_offset_matrix(self, armature_object, obj):
        pose = armature_object.pose
        armature_matrix = armature_object.matrix_world

        world_matrix = obj.matrix_world
        bind_matrices = []
        for i, pose_bone in enumerate(pose.bones):
            armature_bone = pose_bone.bone

            matrix = armature_matrix * armature_bone.matrix_local
            matrix = matrix.inverted() * world_matrix
            # with open(os.path.join(self._dir, pose_bone.name + ".txt"), "w") as assetFile:
            #    assetFile.write(str(matrix))
            #    assetFile.close()

            bind_matrices += tools.matrix_to_list(matrix)

        return bind_matrices

    def export_mesh_textures(self, mesh):
        textures = [None] * len(mesh.materials)
        for i, material in enumerate(mesh.materials):
            if material and material.use_face_texture:
                try:
                    textures[i] = {"image": mesh.tessface_uv_textures[i].data[
                        0].image, "alpha": material.use_face_texture_alpha}
                except:
                    textures[i] = None
        return textures

    def add_mesh_data(self, asset, mesh, armature_info):
        meshName = tools.safe_query_selector_id(mesh.name)
        materialCount = len(mesh.materials)

        # Export based on tess_faces:
        vertices, indices = meshtools.export_tessfaces(mesh, armature_info, self.context)

        if not (vertices and indices):
            return

        content = meshtools.get_vertex_attributes(mesh, vertices)

        compute = None
        includes = None

        if armature_info:
            content.append(DataEntry.create_from_matrix("global_inverse_matrix", armature_info["global_inverse_matrix"]))
            content.append(DataEntry("offset_matrix", DataType.float16, armature_info["offset_matrix"]))
            armature_name = armature_info['name']
            # content.append()
            # asset.data[armature_name] = {"src": armature_info["src"], "includes": None, "compute": None}
            asset.data[armature_name] = {"content": [DataReference(armature_info["src"]), DataEntry("animKey", DataType.float, 1.0)], "includes": None, "compute": None}
            compute = "dataflow['../common/xflow/data-flows.xml#blenderSkinning']"
            includes = armature_info['name']

        asset.data[meshName] = {"content": content, "compute": compute, "includes": includes}

        mesh_textures = self.export_mesh_textures(mesh)

        for materialIndex, material in enumerate(mesh.materials if materialCount else [None]):
            if len(indices[materialIndex]) == 0:
                continue

            materialName = material.name if material else "defaultMaterial"

            data = []
            data.append(DataEntry("index", DataType.int, indices[materialIndex]))

            # Mesh Textures
            if material and mesh_textures[materialIndex] and mesh_textures[materialIndex]["image"]:
                image_src = export_image(mesh_textures[materialIndex]["image"], self.context)
                if image_src:
                    # TODO: Image Sampling parameters
                    # FEATURE: Resize / convert / optimize texture
                    data.append(TextureEntry("diffuseTexture", "../" + image_src))
                if mesh_textures[materialIndex]["alpha"]:
                    data.append(DataEntry("transparency", DataType.float, "0.002"))

            submeshName = meshName + "_" + materialName

            material_url = self.add_material(material)

            asset.meshes.append(
                {"name": submeshName, "includes": meshName, "data": data, "shader": material_url})

    def saveXML(self, f, stats):
        doc = Document()
        xml3d = doc.createElement("xml3d")
        doc.appendChild(xml3d)
        for material in self.materials.values():
            MaterialLibrary.save_material_xml(material, xml3d)

        for asset in self.assets:
            self.asset_xml(asset, xml3d)
        doc.writexml(f, "", "  ", "\n", "UTF-8")

    def asset_xml(self, asset, parent):
        doc = parent.ownerDocument

        asset_element = doc.createElement("asset")
        parent.appendChild(asset_element)

        if asset.id:
            asset_element.setAttribute("id", asset.id)
        if asset.name:
            asset_element.setAttribute("name", asset.name)
        if asset.matrix and not tools.is_identity(asset.matrix):
            asset_element.setAttribute("style", "transform: %s;" % tools.matrix_to_ccs_matrix3d(asset.matrix))
        if asset.src:
            asset_element.setAttribute("src", asset.src)
            return

        for name, value in asset.data.items():
            asset_data = doc.createElement("assetdata")
            asset_data.setAttribute("name", name)

            if 'src' in value:
                asset_data.setAttribute("src", value["src"])

            if 'includes' in value and value["includes"]:
                asset_data.setAttribute("includes", value["includes"])

            if 'compute' in value and value["compute"]:
                asset_data.setAttribute("compute", value["compute"])

            asset_element.appendChild(asset_data)
            if 'content' not in value:
                return

            for entry in value["content"]:
                entryElement = write_generic_entry(doc, entry)
                asset_data.appendChild(entryElement)

        for mesh in asset.meshes:
            asset_mesh = doc.createElement("assetmesh")
            asset_mesh.setAttribute("name", mesh["name"])
            asset_mesh.setAttribute("includes", mesh["includes"])
            if mesh['shader']:
                asset_mesh.setAttribute("shader", mesh["shader"])
            if "transform" in mesh:
                asset_mesh.setAttribute("style", "transform: %s;" % mesh["transform"])

            asset_element.appendChild(asset_mesh)
            for entry in mesh["data"]:
                entryElement = write_generic_entry(doc, entry)
                asset_mesh.appendChild(entryElement)

        for sub_asset in asset.sub_assets.values():
            self.asset_xml(sub_asset, asset_element)

        for ref_asset in asset.ref_assets:
            self.asset_xml(ref_asset, asset_element)

    def save(self):
        stats = self.context.stats

        with open(self._path, "w") as assetFile:
            self.saveXML(assetFile, stats)
            assetFile.close()
            size = os.path.getsize(self._path)

        stats.assets.append({"url": self._path, "size": size, "name": os.path.basename(self._path)})


class ModelConfiguration:
    children = []
    data = []
    name = None

    def __init__(self, name=None):
        self.children = []
        self.name = name

    def __str__(self):
        return "ModelConfiguration(%s, %s, %s)" % (self.name, self.data, self.children)
