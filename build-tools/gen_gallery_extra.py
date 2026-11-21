#!/usr/bin/env python3
"""Generate gallery_extra.json for the SPNATI zh gallery page.

Scans an extracted SPNATI tree (the build's `site/` dir, BEFORE slimming):
for every opponent folder it collects
  - clothes: wardrobe items from behaviour.xml (<clothing name generic position type>)
  - poses:   image files named <stage>-<pose>.<ext>, grouped by stage number
Output: <site>/gallery_extra.json  { "<id>": {"clothes": [[name, generic, position, type], ...],
                                              "poses": {"0": ["0-calm.png", ...], ...}}, ... }
Only characters present in opponents/listing.xml are included.
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

IMG_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
POSE_RE = re.compile(r"^(\d+)-(.+)$")


def main(site_dir: str) -> None:
    opp_dir = os.path.join(site_dir, "opponents")
    listing_path = os.path.join(opp_dir, "listing.xml")
    ids = []
    try:
        root = ET.parse(listing_path).getroot()
        for opp in root.iter("opponent"):
            oid = (opp.text or "").strip()
            status = opp.get("status", "main")
            if oid:
                ids.append((oid, status))
    except Exception as e:
        print(f"listing parse failed: {e}", file=sys.stderr)
        sys.exit(1)

    extra = {}
    for oid, _status in ids:
        folder = os.path.join(opp_dir, oid)
        if not os.path.isdir(folder):
            continue
        entry = {}

        # wardrobe from behaviour.xml
        beh = os.path.join(folder, "behaviour.xml")
        clothes = []
        if os.path.exists(beh):
            try:
                broot = ET.parse(beh).getroot()
                wardrobe = broot.find("wardrobe")
                if wardrobe is not None:
                    for c in wardrobe.iter("clothing"):
                        clothes.append([
                            c.get("name", ""),
                            c.get("generic", ""),
                            c.get("position", ""),
                            c.get("type", ""),
                        ])
            except Exception:
                pass
        if clothes:
            entry["clothes"] = clothes

        # pose images grouped by stage
        poses = {}
        for fn in sorted(os.listdir(folder)):
            base, ext = os.path.splitext(fn)
            if ext.lower() not in IMG_EXTS:
                continue
            m = POSE_RE.match(base)
            if not m:
                continue
            poses.setdefault(m.group(1), []).append(fn)
        if poses:
            entry["poses"] = poses

        if entry:
            extra[oid] = entry

    out_path = os.path.join(site_dir, "gallery_extra.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(extra, f, ensure_ascii=False, separators=(",", ":"))
    total_poses = sum(len(v) for e in extra.values() for v in e.get("poses", {}).values())
    print(f"gallery_extra.json: {len(extra)} characters, {total_poses} pose images, "
          f"{os.path.getsize(out_path) / 1e6:.2f} MB")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "site")
