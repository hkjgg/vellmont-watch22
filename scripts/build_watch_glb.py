"""Procedurally builds a stylized luxury watch model and exports it as watch.glb.

Built entirely from primitives (cylinders, boxes, tori) — no external assets.
Run: python3 scripts/build_watch_glb.py
"""
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

OUT_PATH = "public/models/watch.glb"

GOLD = PBRMaterial(
    baseColorFactor=[0.83, 0.68, 0.35, 1.0],
    metallicFactor=1.0,
    roughnessFactor=0.25,
    name="Gold",
)
DARK_STEEL = PBRMaterial(
    baseColorFactor=[0.08, 0.08, 0.09, 1.0],
    metallicFactor=0.9,
    roughnessFactor=0.35,
    name="DarkSteel",
)
DIAL_BLACK = PBRMaterial(
    baseColorFactor=[0.02, 0.02, 0.03, 1.0],
    metallicFactor=0.2,
    roughnessFactor=0.4,
    name="DialBlack",
)
CRYSTAL = PBRMaterial(
    baseColorFactor=[0.8, 0.9, 1.0, 0.35],
    metallicFactor=0.0,
    roughnessFactor=0.05,
    name="Crystal",
    alphaMode="BLEND",
)
WHITE = PBRMaterial(
    baseColorFactor=[0.95, 0.95, 0.92, 1.0],
    metallicFactor=0.1,
    roughnessFactor=0.5,
    name="MarkerWhite",
)

parts = []


def add(mesh, material, name):
    mesh.visual = trimesh.visual.TextureVisuals(material=material)
    mesh.metadata["name"] = name
    parts.append(mesh)


# --- Case (outer body) ---
case = trimesh.creation.cylinder(radius=1.0, height=0.34, sections=64)
add(case, DARK_STEEL, "Case")

# --- Bezel ring (torus) on top ---
bezel = trimesh.creation.torus(major_radius=0.92, minor_radius=0.08, major_sections=64, minor_sections=24)
bezel.apply_translation([0, 0, 0.17])
add(bezel, GOLD, "Bezel")

# --- Dial (inset disc) ---
dial = trimesh.creation.cylinder(radius=0.82, height=0.04, sections=64)
dial.apply_translation([0, 0, 0.17])
add(dial, DIAL_BLACK, "Dial")

# --- Crystal (glass dome, translucent) ---
crystal = trimesh.creation.cylinder(radius=0.82, height=0.05, sections=64)
crystal.apply_translation([0, 0, 0.2])
add(crystal, CRYSTAL, "Crystal")

# --- Hour markers (12 small gold slivers around the dial) ---
for i in range(12):
    angle = i * (2 * np.pi / 12)
    marker = trimesh.creation.box(extents=[0.05, 0.14, 0.02])
    marker.apply_translation([0, 0.68, 0.2])
    rot = trimesh.transformations.rotation_matrix(angle, [0, 0, 1])
    marker.apply_transform(rot)
    add(marker, GOLD, f"Marker_{i}")

# --- Hands (hour, minute, second) ---
hour_hand = trimesh.creation.box(extents=[0.06, 0.42, 0.03])
hour_hand.apply_translation([0, 0.18, 0.22])
hour_hand.apply_transform(trimesh.transformations.rotation_matrix(0.6, [0, 0, 1]))
add(hour_hand, WHITE, "HourHand")

minute_hand = trimesh.creation.box(extents=[0.045, 0.62, 0.03])
minute_hand.apply_translation([0, 0.28, 0.235])
minute_hand.apply_transform(trimesh.transformations.rotation_matrix(-1.1, [0, 0, 1]))
add(minute_hand, WHITE, "MinuteHand")

second_hand = trimesh.creation.cylinder(radius=0.012, height=0.7, sections=16)
second_hand.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [1, 0, 0]))
second_hand.apply_translation([0, 0.32, 0.24])
second_hand.apply_transform(trimesh.transformations.rotation_matrix(2.2, [0, 0, 1]))
add(second_hand, GOLD, "SecondHand")

center_pin = trimesh.creation.cylinder(radius=0.035, height=0.06, sections=24)
center_pin.apply_translation([0, 0, 0.24])
add(center_pin, GOLD, "CenterPin")

# --- Crown (side button) ---
crown = trimesh.creation.cylinder(radius=0.1, height=0.16, sections=24)
crown.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
crown.apply_translation([1.06, 0, 0])
add(crown, GOLD, "Crown")

# --- Lugs (4 tapered connectors to strap) ---
lug_positions = [
    (0.55, 0.78, np.pi / 4),
    (-0.55, 0.78, -np.pi / 4),
    (0.55, -0.78, -np.pi / 4),
    (-0.55, -0.78, np.pi / 4),
]
for i, (x, y, rz) in enumerate(lug_positions):
    lug = trimesh.creation.box(extents=[0.22, 0.34, 0.14])
    lug.apply_translation([x, y, 0.02])
    lug.apply_transform(trimesh.transformations.rotation_matrix(rz, [0, 0, 1]))
    add(lug, DARK_STEEL, f"Lug_{i}")

# --- Strap: bracelet links extending up (12) and down (12) from the case ---
def build_strap(direction):
    links = []
    link_h = 0.34
    link_gap = 0.05
    y = 1.02
    for i in range(11):
        w = max(0.9 - i * 0.02, 0.55)
        link = trimesh.creation.box(extents=[w, link_h, 0.14])
        link.apply_translation([0, direction * (y + i * (link_h + link_gap)), -0.02])
        links.append(link)
    return trimesh.util.concatenate(links)


strap_top = build_strap(1)
add(strap_top, GOLD, "StrapTop")
strap_bottom = build_strap(-1)
add(strap_bottom, GOLD, "StrapBottom")

# --- Case back (bottom) ---
back = trimesh.creation.cylinder(radius=1.0, height=0.04, sections=64)
back.apply_translation([0, 0, -0.19])
add(back, DARK_STEEL, "CaseBack")

scene = trimesh.Scene()
for p in parts:
    scene.add_geometry(p, node_name=p.metadata["name"])

# Center & scale to a reasonable unit size
scene.apply_transform(trimesh.transformations.scale_matrix(1.0))

import os
os.makedirs("public/models", exist_ok=True)
scene.export(OUT_PATH)
print(f"Exported {OUT_PATH}")
