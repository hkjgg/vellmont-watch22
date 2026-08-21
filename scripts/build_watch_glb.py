"""Procedurally builds a stylized luxury watch with a swappable-material case
and a named, exploded-assembly-ready movement stack, exported as watch.glb.

Node names are load-bearing — the app looks parts up by these exact names:
  Material swap (shared "CaseMetal" material): Case, Bezel, Crown, Lug_0..3,
    StrapTop, StrapBottom, CaseBack
  Exploded movement layers (each its own top-level node): Dial, Tourbillon,
    Mainplate, Barrel, Baseplate, Weight

Built entirely from primitives — no external assets.
Run: python3 scripts/build_watch_glb.py
"""
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

OUT_PATH = "public/models/watch.glb"

# Silver Steel is the material.glb ships with; the app swaps color/metalness/
# roughness on the "CaseMetal" material at runtime for the other 3 presets.
CASE_METAL = PBRMaterial(
    baseColorFactor=[0.78, 0.79, 0.81, 1.0],
    metallicFactor=1.0,
    roughnessFactor=0.28,
    name="CaseMetal",
)
DIAL_BLACK = PBRMaterial(baseColorFactor=[0.03, 0.03, 0.035, 1.0], metallicFactor=0.2, roughnessFactor=0.4, name="DialBlack")
CRYSTAL = PBRMaterial(baseColorFactor=[0.8, 0.9, 1.0, 0.35], metallicFactor=0.0, roughnessFactor=0.05, name="Crystal", alphaMode="BLEND")
WHITE = PBRMaterial(baseColorFactor=[0.95, 0.95, 0.92, 1.0], metallicFactor=0.1, roughnessFactor=0.5, name="MarkerWhite")
GOLD_ACCENT = PBRMaterial(baseColorFactor=[0.83, 0.68, 0.35, 1.0], metallicFactor=1.0, roughnessFactor=0.22, name="GoldAccent")
BRASS = PBRMaterial(baseColorFactor=[0.72, 0.58, 0.32, 1.0], metallicFactor=0.85, roughnessFactor=0.38, name="MovementBrass")
STEEL_MOVEMENT = PBRMaterial(baseColorFactor=[0.62, 0.63, 0.66, 1.0], metallicFactor=0.9, roughnessFactor=0.32, name="MovementSteel")
RUBY = PBRMaterial(baseColorFactor=[0.7, 0.08, 0.12, 1.0], metallicFactor=0.1, roughnessFactor=0.2, name="Jewel")

scene = trimesh.Scene()


def add(mesh, material, name, parent=None, transform=None):
    mesh.visual = trimesh.visual.TextureVisuals(material=material)
    scene.add_geometry(mesh, node_name=name, parent_node_name=parent, transform=transform)


# ---------------------------------------------------------------- Case shell
case = trimesh.creation.cylinder(radius=1.0, height=0.34, sections=64)
add(case, CASE_METAL, "Case")

bezel = trimesh.creation.torus(major_radius=0.92, minor_radius=0.08, major_sections=64, minor_sections=24)
add(bezel, CASE_METAL, "Bezel", transform=trimesh.transformations.translation_matrix([0, 0, 0.17]))

crystal = trimesh.creation.cylinder(radius=0.82, height=0.05, sections=64)
add(crystal, CRYSTAL, "Crystal", transform=trimesh.transformations.translation_matrix([0, 0, 0.2]))

crown = trimesh.creation.cylinder(radius=0.1, height=0.16, sections=24)
crown.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
add(crown, CASE_METAL, "Crown", transform=trimesh.transformations.translation_matrix([1.06, 0, 0]))

lug_positions = [(0.55, 0.78, np.pi / 4), (-0.55, 0.78, -np.pi / 4), (0.55, -0.78, -np.pi / 4), (-0.55, -0.78, np.pi / 4)]
for i, (x, y, rz) in enumerate(lug_positions):
    lug = trimesh.creation.box(extents=[0.22, 0.34, 0.14])
    tf = trimesh.transformations.concatenate_matrices(
        trimesh.transformations.translation_matrix([x, y, 0.02]),
        trimesh.transformations.rotation_matrix(rz, [0, 0, 1]),
    )
    add(lug, CASE_METAL, f"Lug_{i}", transform=tf)


def build_strap(direction):
    links = []
    link_h, link_gap, y = 0.34, 0.05, 1.02
    for i in range(11):
        w = max(0.9 - i * 0.02, 0.55)
        link = trimesh.creation.box(extents=[w, link_h, 0.14])
        link.apply_translation([0, direction * (y + i * (link_h + link_gap)), -0.02])
        links.append(link)
    return trimesh.util.concatenate(links)


add(build_strap(1), CASE_METAL, "StrapTop")
add(build_strap(-1), CASE_METAL, "StrapBottom")

back = trimesh.creation.cylinder(radius=1.0, height=0.04, sections=64)
add(back, CASE_METAL, "CaseBack", transform=trimesh.transformations.translation_matrix([0, 0, -0.19]))

# ------------------------------------------------------- Movement (exploded)
# Each of these six is a top-level named node at its assembled ("closed")
# position; the app animates node.position along local Z to explode/reset.

# Baseplate — bottom-most foundation plate, nearest the case back.
baseplate = trimesh.creation.cylinder(radius=0.78, height=0.03, sections=64)
add(baseplate, STEEL_MOVEMENT, "Baseplate", transform=trimesh.transformations.translation_matrix([0, 0, -0.14]))

# Weight — oscillating rotor, a half-moon slab off-center so it reads as a
# rotor rather than a full disc.
weight_full = trimesh.creation.cylinder(radius=0.7, height=0.025, sections=48)
cut = trimesh.creation.box(extents=[1.6, 1.6, 0.1])
cut.apply_translation([-0.8, 0, 0])
weight = weight_full.difference(cut)
add(weight, GOLD_ACCENT, "Weight", transform=trimesh.transformations.translation_matrix([0.15, 0, -0.1]))

# Barrel — mainspring barrel, offset toward one side.
barrel = trimesh.creation.cylinder(radius=0.16, height=0.09, sections=32)
add(barrel, BRASS, "Barrel", transform=trimesh.transformations.translation_matrix([0.32, 0.18, -0.05]))

# Mainplate — the large central plate the movement is built on.
mainplate = trimesh.creation.cylinder(radius=0.62, height=0.03, sections=64)
add(mainplate, BRASS, "Mainplate", transform=trimesh.transformations.translation_matrix([0, 0, 0.0]))

# Tourbillon — small rotating cage assembly with a jewel at its heart.
tb_cage = trimesh.creation.cylinder(radius=0.14, height=0.05, sections=32)
tb_inner_cut = trimesh.creation.cylinder(radius=0.1, height=0.07, sections=32)
tb_cage = tb_cage.difference(tb_inner_cut)
tb_jewel = trimesh.creation.icosphere(radius=0.035, subdivisions=2)
tb_jewel.apply_translation([0, 0, 0.03])
tb_arm1 = trimesh.creation.box(extents=[0.03, 0.24, 0.02])
tb_arm2 = trimesh.creation.box(extents=[0.24, 0.03, 0.02])
tourbillon_cage = trimesh.util.concatenate([tb_cage, tb_arm1, tb_arm2])
add(tourbillon_cage, STEEL_MOVEMENT, "Tourbillon", transform=trimesh.transformations.translation_matrix([-0.22, -0.32, 0.06]))
add(tb_jewel, RUBY, "Tourbillon_Jewel", parent="Tourbillon")

# ------------------------------------------------------------------- Dial
# "Dial" is the parent node for the whole dial-face assembly (disc, hour
# markers, hands, center pin) so it explodes/moves as a single group.
dial_disc = trimesh.creation.cylinder(radius=0.82, height=0.04, sections=64)
add(dial_disc, DIAL_BLACK, "Dial", transform=trimesh.transformations.translation_matrix([0, 0, 0.17]))

for i in range(12):
    angle = i * (2 * np.pi / 12)
    marker = trimesh.creation.box(extents=[0.05, 0.14, 0.02])
    marker_tf = trimesh.transformations.rotation_matrix(angle, [0, 0, 1]) @ trimesh.transformations.translation_matrix([0, 0.68, 0.03])
    add(marker, GOLD_ACCENT, f"Marker_{i}", parent="Dial", transform=marker_tf)

hour_hand = trimesh.creation.box(extents=[0.06, 0.42, 0.03])
hour_tf = trimesh.transformations.rotation_matrix(0.6, [0, 0, 1]) @ trimesh.transformations.translation_matrix([0, 0.18, 0.05])
add(hour_hand, WHITE, "HourHand", parent="Dial", transform=hour_tf)

minute_hand = trimesh.creation.box(extents=[0.045, 0.62, 0.03])
minute_tf = trimesh.transformations.rotation_matrix(-1.1, [0, 0, 1]) @ trimesh.transformations.translation_matrix([0, 0.28, 0.065])
add(minute_hand, WHITE, "MinuteHand", parent="Dial", transform=minute_tf)

second_hand = trimesh.creation.cylinder(radius=0.012, height=0.7, sections=16)
second_hand.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [1, 0, 0]))
second_tf = trimesh.transformations.rotation_matrix(2.2, [0, 0, 1]) @ trimesh.transformations.translation_matrix([0, 0.32, 0.07])
add(second_hand, GOLD_ACCENT, "SecondHand", parent="Dial", transform=second_tf)

center_pin = trimesh.creation.cylinder(radius=0.035, height=0.06, sections=24)
add(center_pin, GOLD_ACCENT, "CenterPin", parent="Dial", transform=trimesh.transformations.translation_matrix([0, 0, 0.07]))

import os
os.makedirs("public/models", exist_ok=True)
scene.export(OUT_PATH)
print(f"Exported {OUT_PATH}")
print("Nodes:", sorted(scene.graph.nodes_geometry))
