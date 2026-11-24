#!/usr/bin/env python3
"""
NA3DB thumbnail renderer
========================
One square picture per structure, all drawn the same way, so that two
thumbnails side by side can be compared.

What a thumbnail shows:

  - the nucleic acid as a cartoon: a tube along the backbone, every base
    drawn as a filled ring, so a duplex reads as a ladder
  - RNA in blue and DNA in orange, so the kind of molecule is legible
    from the thumbnail alone and a hybrid shows both at once
  - the strands of one molecule in different shades of its colour, so
    the two sides of a duplex can be told apart without losing which
    kind it is
  - protein, when there is any, as a pale grey cartoon behind it
  - ions and other small molecules as spheres, coloured by element

The three rules that make the set standard:

  1. Orientation is computed, never chosen. The longest axis of the
     molecule stands upright, the second longest goes across. A duplex
     therefore reads as a vertical helix in every picture, which is how
     a double helix is usually drawn. The signs are fixed too (see
     `orientation`), so two copies of the same duplex cannot come out
     mirrored.
  2. Framing is the same: the molecule is fitted to the frame with the
     same padding every time.
  3. Everything else, lighting included, is set below and never varies.

Usage:
    render_thumbnails.py --cif-dir ../dnatco_cif --out ../NA3DB/public/assets/thumbs
    render_thumbnails.py --cif 1BNA.cif --out /tmp            # one file
    render_thumbnails.py --cif-dir ... --out ... --force      # redo existing

The id in the file name is the name the website uses: `1BNA.png`, upper
case, from the CIF's own `_entry.id` when it has one, else the file name.
"""

import argparse
import colorsys
import logging
import math
import os
import sys
from pathlib import Path

import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("thumbs")

# ---------------------------------------------------------------- settings

SIZE = 300          # pixels, square
PADDING = 1.18      # 1.0 touches the edge; 1.18 leaves a thin margin
RAY = True          # ray trace. Off is ~20x faster and visibly worse.

# Blue is RNA, orange is DNA. The blue is the site's own accent, the
# orange its warm opposite; the two stay apart for the common kinds of
# colour blindness and read on both the light and the dark theme, which
# matters because the background is transparent.
RNA_BLUE = (0.141, 0.314, 0.561)     # 24 50 8f
DNA_ORANGE = (0.831, 0.471, 0.110)   # d4 78 1c

# The strands of one molecule, told apart by lightness alone so that the
# hue, which carries the RNA-or-DNA meaning, never changes. The first
# strand is the colour itself; after that they step lighter and darker
# in turn, which keeps two strands as far apart as possible and still
# gives a usable eight.
STRAND_STEPS = (0.0, 0.17, -0.14, 0.30, -0.25, 0.42, -0.33, 0.09)
LIGHTNESS_RANGE = (0.20, 0.84)       # never flat white, never flat black

PROTEIN_GREY = (0.729, 0.745, 0.776)
PROTEIN_TRANSPARENCY = 0.72   # protein is context, the nucleic acid is the subject

# Residue names that count as nucleic acid even though PyMOL's own
# `nucleic` selection can miss them: the modified nucleotides the
# database is full of are caught by the ring test below instead, so this
# stays short.
NUCLEIC_EXTRA = "DA+DC+DG+DT+DU+A+C+G+U+PSU+5MC+7MG+1MA+2MG+M2G+H2U+OMC+OMG+4SU+5BU"

# ------------------------------------------------------------- the picture


def shade(base, index):
    """The index-th shade of a colour: same hue, different lightness."""
    hue, light, sat = colorsys.rgb_to_hls(*base)
    light += STRAND_STEPS[index % len(STRAND_STEPS)]
    light = min(LIGHTNESS_RANGE[1], max(LIGHTNESS_RANGE[0], light))
    return colorsys.hls_to_rgb(hue, light, sat)


def is_rna(cmd, selection):
    """True for RNA, by the one atom that separates it from DNA.

    Not by residue name: the database is full of modified nucleotides,
    and a name tells you nothing about a residue the dictionary has
    never heard of. The 2' oxygen of the ribose does, and it is in every
    RNA residue and no DNA one. A whole chain is called by its majority,
    so a single odd residue cannot flip it.
    """
    sugars = cmd.count_atoms(selection + " and name C1'")
    if not sugars:
        return False
    return cmd.count_atoms(selection + " and name O2'") * 2 > sugars


def start_pymol():
    """Brings PyMOL up with no window and no startup files."""
    import pymol
    pymol.finish_launching(["pymol", "-qck"])
    from pymol import cmd
    return cmd


def house_style(cmd):
    """Every drawing decision, in one place. Called once per process."""
    cmd.set("ray_opaque_background", 0)      # transparent PNG
    cmd.set("antialias", 2)
    cmd.set("orthoscopic", 1)                # no perspective, so sizes compare
    cmd.set("ray_trace_mode", 0)
    cmd.set("ray_shadows", 0)                # shadows read as dirt at 300px
    cmd.set("specular", 0.15)
    cmd.set("ambient", 0.22)
    cmd.set("direct", 0.55)
    cmd.set("reflect", 0.35)
    cmd.set("depth_cue", 0)                  # no fog: a thumbnail is too small
    cmd.set("ray_trace_fog", 0)
    cmd.set("cartoon_ring_mode", 3)          # filled ring with an edge
    cmd.set("cartoon_ring_finder", 1)        # find rings in modified bases too
    cmd.set("cartoon_ring_transparency", 0.0)
    cmd.set("cartoon_nucleic_acid_mode", 4)  # tube through the phosphates
    cmd.set("cartoon_tube_radius", 0.55)
    cmd.set("cartoon_ladder_mode", 1)
    cmd.set("cartoon_side_chain_helper", 1)
    cmd.set("cartoon_transparency", 0.0)
    cmd.set("sphere_scale", 0.45)
    cmd.set("all_states", 0)
    cmd.set("assembly", "")                  # the deposited coordinates
    cmd.set("cif_use_auth", 1)               # author chain ids, as the site shows
    cmd.set("retain_order", 0)
    cmd.set("pdb_discrete_chains", 0)


def orientation(coords):
    """A rotation that stands the molecule's longest axis upright.

    The axes come from the spread of the coordinates, which is the one
    choice of axes the molecule itself decides: the first is the
    direction it reaches furthest in, so whichever way a duplex was
    deposited, that first axis runs along the helix.

    That axis becomes the screen's **y**, so the helix stands up, and
    the second becomes the screen's x. A duplex is then the upright
    double helix of every textbook, and a flat molecule lies with its
    long side down the page, where a square frame has the most room for
    it.

    Eigenvectors have no sign, and that is the whole difficulty: left to
    itself the same duplex can come out mirrored between two entries.
    So the sign is fixed by a rule that depends only on the
    coordinates: each axis is turned so that its largest component is
    positive. The third axis is then the cross product of the other two,
    which also makes the rotation right-handed.

    Returns a 3x3 matrix whose rows are the new x, y and z.
    """
    centred = coords - coords.mean(axis=0)
    # Right singular vectors of the centred coordinates: the directions
    # of greatest spread, widest first.
    _, _, spread = np.linalg.svd(centred, full_matrices=False)
    spread = np.array(spread[:3], dtype=float)

    for i in (0, 1):
        a = spread[i]
        if a[int(np.argmax(np.abs(a)))] < 0:
            spread[i] = -a

    # The widest direction is the screen's y, the next its x: upright,
    # not lying down. The cross product keeps the rotation right-handed,
    # so nothing is drawn as its own mirror image.
    axes = np.empty((3, 3))
    axes[0] = spread[1]
    axes[1] = spread[0]
    axes[2] = np.cross(axes[0], axes[1])
    return axes


def frame(cmd, name, rotation, subject):
    """Points the camera down the computed axes and fits the subject.

    PyMOL's view is 18 numbers: a 3x3 rotation, the camera position, the
    point it looks at, and the two clipping planes. Setting them by hand
    rather than calling `orient` is what makes the result repeatable.

    The frame is fitted to `subject`, the nucleic acid, not to everything
    loaded. In a ribosome or a polymerase the RNA is a thread inside a
    protein the size of the screen, and a thumbnail fitted to the whole
    complex shows a grey blob. Fitted to the nucleic acid, the same
    entry shows the nucleic acid, with the protein running out of the
    frame behind it, which is the right subject for this database.
    """
    coords = np.array(cmd.get_coords(subject), dtype=float)
    centre = coords.mean(axis=0)
    turned = (coords - centre) @ rotation.T

    # Half-width of the molecule across the frame, in angstroms. The
    # same number horizontally and vertically keeps the picture square
    # and keeps the scale honest; the larger of the two wins.
    half = max(np.abs(turned[:, 0]).max(), np.abs(turned[:, 1]).max())
    half = max(half * PADDING, 4.0)

    # The clipping planes take in everything that is loaded, not just
    # the subject, so that a protein standing in front of the nucleic
    # acid is drawn whole rather than sliced open.
    everything = np.array(cmd.get_coords(name + " and not hydro"), dtype=float)
    depth = np.abs((everything - centre) @ rotation.T)[:, 2].max() + 6.0

    # Orthoscopic PyMOL still takes the field of view from the distance,
    # so the distance that makes `half` fill the frame is this.
    fov = float(cmd.get("field_of_view"))
    distance = half / math.tan(math.radians(fov) / 2.0)

    # PyMOL reads these nine numbers as the transpose of the rotation
    # used above, so the matrix goes in the other way round. Checked
    # against the picture, not assumed: with the rows as computed, a
    # straight duplex comes out on the diagonal.
    camera = rotation.T
    view = (
        *camera[0], *camera[1], *camera[2],
        0.0, 0.0, -distance,
        *centre,
        distance - depth, distance + depth,
        -fov,
    )
    cmd.set_view(view)


def draw(cmd, name):
    """Turns the loaded molecule into the house representation."""
    cmd.remove(name + " and hydro")
    cmd.remove(name + " and not alt ''+A")   # one conformer only
    cmd.remove(name + " and solvent")        # water would only add noise

    nucleic = "(%s and (polymer.nucleic or resn %s))" % (name, NUCLEIC_EXTRA)
    protein = "(%s and polymer.protein)" % name
    other = "(%s and not (polymer.nucleic or resn %s) and not polymer.protein)" % (
        name, NUCLEIC_EXTRA)

    cmd.hide("everything", name)
    cmd.show("cartoon", nucleic)
    cmd.show("spheres", other)
    cmd.util.cnc(other)                       # colour by element
    if cmd.count_atoms(protein):
        # A ghost, not a subject: pale, see-through, and behind. The
        # setting goes on the protein atoms alone, so the nucleic acid
        # in front of it stays solid.
        cmd.show("cartoon", protein)
        cmd.set_color("na3db_protein", list(PROTEIN_GREY))
        cmd.color("na3db_protein", protein)
        cmd.set("cartoon_transparency", PROTEIN_TRANSPARENCY, protein)

    # Blue for RNA, orange for DNA, a shade apart for each strand. The
    # two kinds are counted separately, so the first RNA chain and the
    # first DNA chain each get the plain colour of their kind: in a
    # hybrid the two sides then read as blue and orange rather than as
    # two shades of one thing.
    seen = {True: 0, False: 0}
    for chain in sorted(set(cmd.get_chains(nucleic))):
        strand = "%s and chain %s" % (nucleic, chain)
        rna = is_rna(cmd, strand)
        colour = shade(RNA_BLUE if rna else DNA_ORANGE, seen[rna])
        seen[rna] += 1
        label = "na3db_%s_%d" % ("rna" if rna else "dna", seen[rna])
        cmd.set_color(label, list(colour))
        cmd.color(label, strand)


def entry_id(path, cmd, name):
    """The id the website uses: the CIF's own, else the file name."""
    for key in ("entry.id", "_entry.id"):
        got = cmd.get_property(key, name) if hasattr(cmd, "get_property") else None
        if got:
            return str(got).upper()
    stem = Path(path).name
    for suffix in (".gz", ".cif", ".mmcif"):
        if stem.lower().endswith(suffix):
            stem = stem[: -len(suffix)]
    return stem.upper()


def render(cmd, cif, out_dir, size=SIZE, force=False):
    """One CIF in, one PNG out. Returns the path written, or None."""
    name = "m"
    cmd.delete("all")
    cmd.load(str(cif), name)

    pdb_id = entry_id(cif, cmd, name)
    target = Path(out_dir) / ("%s.png" % pdb_id)
    if target.exists() and not force:
        log.debug("%s already there", pdb_id)
        return None

    if not cmd.count_atoms(name):
        log.warning("%s has no atoms, skipped", pdb_id)
        return None

    draw(cmd, name)
    # The axes come from the nucleic acid alone: a bound protein or a
    # long crystallisation tail would otherwise decide the view of a
    # molecule the database is not about.
    got = cmd.get_coords("(%s and (polymer.nucleic or resn %s)) and not hydro"
                         % (name, NUCLEIC_EXTRA))
    subject = "(%s and (polymer.nucleic or resn %s)) and not hydro" % (
        name, NUCLEIC_EXTRA)
    got = cmd.get_coords(subject)
    if got is None or len(got) < 3:
        subject = name + " and not hydro"
        got = cmd.get_coords(subject)
    frame(cmd, name, orientation(np.array(got, dtype=float)), subject)

    target.parent.mkdir(parents=True, exist_ok=True)
    cmd.png(str(target), width=size, height=size, ray=int(RAY))
    cmd.refresh()
    if not target.exists() or target.stat().st_size == 0:
        raise RuntimeError("PyMOL wrote nothing for %s" % pdb_id)
    return target


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cif", action="append", default=[],
                    help="one CIF file; repeatable")
    ap.add_argument("--cif-dir", help="a directory of .cif files")
    ap.add_argument("--out", required=True, help="where the PNGs go")
    ap.add_argument("--size", type=int, default=SIZE, help="pixels, square")
    ap.add_argument("--force", action="store_true", help="redo existing PNGs")
    ap.add_argument("--limit", type=int, help="stop after this many, for a look")
    args = ap.parse_args(argv)

    files = [Path(p) for p in args.cif]
    if args.cif_dir:
        # The plain .cif, not the .gz beside it: PyMOL reads both, but
        # one picture per structure is the point.
        files += sorted(p for p in Path(args.cif_dir).iterdir()
                        if p.suffix.lower() in (".cif", ".mmcif"))
    if not files:
        ap.error("nothing to render: give --cif or --cif-dir")
    if args.limit:
        files = files[: args.limit]

    cmd = start_pymol()
    house_style(cmd)

    done = skipped = failed = 0
    for i, cif in enumerate(files, 1):
        try:
            got = render(cmd, cif, args.out, size=args.size, force=args.force)
            if got:
                done += 1
                log.info("[%d/%d] %s", i, len(files), got.name)
            else:
                skipped += 1
        except Exception as exc:                      # one bad file is not the run
            failed += 1
            log.error("[%d/%d] %s: %s", i, len(files), cif.name, exc)

    log.info("%d drawn, %d already there, %d failed", done, skipped, failed)
    return 1 if failed and not done else 0


if __name__ == "__main__":
    sys.exit(main())
