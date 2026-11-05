#!/usr/bin/env python3
"""Build the bundled exercise library from the public wger catalog.

English names, muscles, and the main demonstration image are taken from
https://wger.de/api/v2/exerciseinfo/ (CC BY-SA 4.0). Ids stay `wger-<id>`.
"""

from __future__ import annotations

import json
import re
import urllib.request
from collections import Counter
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "exercises"
LIBRARY_PATH = ROOT / "src" / "library.ts"
GIFS_PATH = ROOT / "src" / "gifs.ts"
API = "https://wger.de/api/v2/exerciseinfo/?format=json&limit=50"
USER_AGENT = "gymapp-wger-import/1.0"

# wger muscle ids: https://wger.de/api/v2/muscle/
# Serratus stays with chest, traps with back, brachialis with biceps, soleus with calves.
MUSCLE_BY_ID = {
    1: "biceps",
    2: "shoulders",
    3: "chest",
    4: "chest",
    5: "triceps",
    6: "core",
    7: "calves",
    8: "glutes",
    9: "back",
    10: "quads",
    11: "hamstrings",
    12: "back",
    13: "biceps",
    14: "core",
    15: "calves",
}
WGER_CATEGORY = {
    "Abs": "core",
    "Back": "pull",
    "Calves": "legs",
    "Cardio": "legs",
    "Chest": "push",
    "Legs": "legs",
    "Shoulders": "push",
}
# Ids already stored in workout logs. The matching wger exercise keeps that id.
LEGACY_IDS = {
    73: "bench-press",
    537: "incline-dumbbell-press",
    687: "overhead-press",
    1551: "push-up",
    194: "dip",
    348: "lateral-raise",
    475: "pull-up",
    723: "lat-pulldown",
    1698: "barbell-row",
    81: "dumbbell-row",
    1639: "face-pull",
    91: "biceps-curl",
    615: "squat",
    184: "deadlift",
    507: "romanian-deadlift",
    371: "leg-press",
    984: "lunge",
    364: "leg-curl",
    622: "calf-raise",
    458: "plank",
    167: "crunch",
    283: "hanging-leg-raise",
}
CATEGORY_MUSCLES = {
    "Abs": ["core"],
    "Arms": ["biceps"],
    "Back": ["back"],
    "Calves": ["calves"],
    "Cardio": ["quads"],
    "Chest": ["chest"],
    "Legs": ["quads", "glutes"],
    "Shoulders": ["shoulders"],
}


def fetch_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode())


def fetch_bytes(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def all_exercises() -> list[dict]:
    url: str | None = API
    rows: list[dict] = []
    while url:
        page = fetch_json(url)
        rows.extend(page["results"])
        url = page.get("next")
        print(f"fetched {len(rows)} / {page['count']}", flush=True)
    return rows


def map_muscle(muscle: dict) -> str | None:
    mapped = MUSCLE_BY_ID.get(muscle.get("id"))
    if mapped:
        return mapped
    text = f"{muscle.get('name_en') or ''} {muscle.get('name') or ''}".lower()
    if "forearm" in text or "brachioradialis" in text:
        return "forearms"
    return None


def choose_category(muscles: list[str], wger_category: str) -> tuple[str, list[str]]:
    if wger_category == "Arms":
        push = sum(muscle in {"triceps"} for muscle in muscles)
        pull = sum(muscle in {"biceps", "forearms"} for muscle in muscles)
        category = "push" if push > pull else "pull"
    else:
        category = WGER_CATEGORY.get(wger_category, "core")
    if not muscles:
        muscles = list(CATEGORY_MUSCLES.get(wger_category, ["core"]))
    return category, muscles


def english_name(exercise: dict) -> str | None:
    for translation in exercise.get("translations") or []:
        if translation.get("language") == 2 and (translation.get("name") or "").strip():
            return " ".join(translation["name"].split())
    return None


def image_url(image: dict) -> str | None:
    return image.get("image") or image.get("image_url") or None


def main_image_url(exercise: dict) -> str | None:
    images = exercise.get("images") or []
    if not images:
        return None
    gifs = [image for image in images if (image_url(image) or "").lower().split("?")[0].endswith(".gif")]
    pool = gifs or images
    chosen = next((image for image in pool if image.get("is_main")), pool[0])
    return image_url(chosen)


def save_image(url: str, destination_stem: Path) -> str | None:
    try:
        raw = fetch_bytes(url)
        image = Image.open(BytesIO(raw))
        destination_stem.parent.mkdir(parents=True, exist_ok=True)
        frames = getattr(image, "n_frames", 1)
        if frames > 1 and image.format == "GIF":
            destination = destination_stem.with_suffix(".gif")
            destination.write_bytes(raw)
            return destination.name
        if frames > 1 and image.format == "WEBP":
            destination = destination_stem.with_suffix(".webp")
            destination.write_bytes(raw)
            return destination.name
        image = image.convert("RGB")
        image.thumbnail((480, 480))
        destination = destination_stem.with_suffix(".jpg")
        image.save(destination, "JPEG", quality=75, optimize=True)
        return destination.name
    except Exception as error:
        print(f"image skipped {url}: {error}", flush=True)
        return None


def unique_name(name: str, equipment: list[str], exercise_id: int, used: set[str]) -> str:
    if name.lower() not in used:
        used.add(name.lower())
        return name
    suffix = ", ".join(equipment) if equipment else str(exercise_id)
    candidate = f"{name} ({suffix})"
    if candidate.lower() not in used:
        used.add(candidate.lower())
        return candidate
    candidate = f"{name} ({exercise_id})"
    used.add(candidate.lower())
    return candidate


def write_library(exercises: list[dict]) -> None:
    lines = [
        'import type { BuiltinExercise } from "@/domain";',
        "",
        "/** English exercise catalog from wger.de, CC BY-SA 4.0.",
        " * New ids are `wger-<wger id>`. The original 22 exercises keep their first ids.",
        " */",
        'export const LIBRARY_CREDIT = "Exercise data from wger.de contributors, CC BY-SA 4.0.";',
        "",
        "export const BUILTIN_EXERCISES: BuiltinExercise[] = [",
    ]
    for exercise in exercises:
        muscles = ", ".join(json.dumps(muscle) for muscle in exercise["muscles"])
        lines.append(
            "  { "
            f"id: {json.dumps(exercise['id'])}, "
            f"name: {json.dumps(exercise['name'], ensure_ascii=False)}, "
            f"category: {json.dumps(exercise['category'])}, "
            f"muscles: [{muscles}] "
            "},"
        )
    lines.append("];")
    lines.append("")
    LIBRARY_PATH.write_text("\n".join(lines), encoding="utf-8")


def write_gifs(images: dict[str, str]) -> None:
    lines = [
        'import type { ImageSource } from "expo-image";',
        "",
        'import type { LibraryExercise } from "@/domain";',
        'import { customGifUri } from "@/storage";',
        "",
        "export const builtinGifSources: Record<string, ImageSource> = {",
    ]
    for exercise_id, filename in images.items():
        lines.append(f"  {json.dumps(exercise_id)}: require({json.dumps('../assets/exercises/' + filename)}),")
    lines.extend(
        [
            "};",
            "",
            "export function exerciseGifSource(exercise: LibraryExercise): ImageSource | null {",
            "  if (exercise.source === \"builtin\") return builtinGifSources[exercise.id] ?? null;",
            "  if (exercise.gifBase64) {",
            "    return { uri: `data:image/gif;base64,${exercise.gifBase64}` };",
            "  }",
            "  if (exercise.gifFile) {",
            "    const uri = customGifUri(exercise.gifFile);",
            "    return uri ? { uri } : null;",
            "  }",
            "  return null;",
            "}",
            "",
        ]
    )
    GIFS_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    raw = all_exercises()
    unknown = Counter()
    prepared = []
    used_names: set[str] = set()
    for exercise in raw:
        name = english_name(exercise)
        if not name:
            continue
        muscles: list[str] = []
        for muscle in (exercise.get("muscles") or []) + (exercise.get("muscles_secondary") or []):
            mapped = map_muscle(muscle)
            if mapped and mapped not in muscles:
                muscles.append(mapped)
            elif not mapped:
                unknown[f"{muscle.get('id')} {muscle.get('name_en')} | {muscle.get('name')}"] += 1
        category_name = (exercise.get("category") or {}).get("name") or ""
        category, muscles = choose_category(muscles, category_name)
        # wger has no forearm muscle. Name the app muscle when the exercise is one.
        if re.search(r"forearm|brachioradialis", name, re.I) and "forearms" not in muscles:
            muscles.append("forearms")
        equipment = [item.get("name") for item in exercise.get("equipment") or [] if item.get("name")]
        prepared.append(
            {
                "id": LEGACY_IDS.get(exercise["id"], f"wger-{exercise['id']}"),
                "wger_id": exercise["id"],
                "name": unique_name(name, equipment, exercise["id"], used_names),
                "category": category,
                "muscles": muscles,
                "image": main_image_url(exercise),
            }
        )
    prepared.sort(key=lambda item: item["name"].lower())
    print(f"english exercises: {len(prepared)}")
    print(f"with images: {sum(1 for item in prepared if item['image'])}")
    if unknown:
        print("unmapped muscles:")
        for label, count in unknown.most_common():
            print(f"  {count:4} {label}")

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    for old in ASSET_DIR.iterdir():
        if old.is_file():
            old.unlink()

    images: dict[str, str] = {}
    for index, exercise in enumerate(prepared, start=1):
        if not exercise["image"]:
            continue
        filename = save_image(exercise["image"], ASSET_DIR / exercise["id"])
        if filename:
            images[exercise["id"]] = filename
        if index % 25 == 0:
            print(f"images {len(images)} saved, scanned {index}", flush=True)

    write_library(prepared)
    write_gifs(images)
    print(f"wrote {len(prepared)} exercises and {len(images)} images")


if __name__ == "__main__":
    main()
