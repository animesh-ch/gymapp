#!/usr/bin/env python3
"""Generate schematic demonstration GIFs for the built-in exercise library."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "assets" / "exercises"
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
SIZE = 240
BACKGROUND = (16, 18, 14)
LIME = (214, 242, 92)
SOFT = (90, 98, 78)
BAR = (232, 236, 214)

Point = tuple[float, float]
Joints = dict[str, Point]

EXERCISES = [
    ("bench-press", "Bench press", "bench"),
    ("incline-dumbbell-press", "Incline press", "incline"),
    ("overhead-press", "Overhead press", "press"),
    ("push-up", "Push-up", "pushup"),
    ("dip", "Dip", "dip"),
    ("lateral-raise", "Lateral raise", "raise"),
    ("pull-up", "Pull-up", "pullup"),
    ("lat-pulldown", "Lat pulldown", "pulldown"),
    ("barbell-row", "Barbell row", "row"),
    ("dumbbell-row", "Dumbbell row", "row"),
    ("face-pull", "Face pull", "face"),
    ("biceps-curl", "Biceps curl", "curl"),
    ("squat", "Squat", "squat"),
    ("deadlift", "Deadlift", "deadlift"),
    ("romanian-deadlift", "Romanian deadlift", "hinge"),
    ("leg-press", "Leg press", "legpress"),
    ("lunge", "Lunge", "lunge"),
    ("leg-curl", "Leg curl", "legcurl"),
    ("calf-raise", "Calf raise", "calf"),
    ("plank", "Plank", "plank"),
    ("crunch", "Crunch", "crunch"),
    ("hanging-leg-raise", "Leg raise", "legraise"),
]

LINKS = (
    ("shoulder", "hip"),
    ("shoulder", "hand"),
    ("shoulder", "hand2"),
    ("hip", "knee"),
    ("knee", "foot"),
    ("hip", "knee2"),
    ("knee2", "foot2"),
)


def mix(start: float, end: float, t: float) -> float:
    return start + (end - start) * t


def point(start: Point, end: Point, t: float) -> Point:
    return (mix(start[0], end[0], t), mix(start[1], end[1], t))


def blend(start: Joints, end: Joints, t: float) -> Joints:
    return {name: point(start[name], end[name], t) for name in start}


def standing(arm_y: float, knee_drop: float = 0, rise: float = 0) -> Joints:
    y = -rise
    return {
        "head": (120, 58 + y + knee_drop * 0.15),
        "shoulder": (120, 78 + y + knee_drop * 0.2),
        "hip": (120, 118 + y + knee_drop * 0.35),
        "hand": (96, arm_y + y),
        "hand2": (144, arm_y + y),
        "knee": (104, 146 + knee_drop * 0.2),
        "knee2": (136, 146 + knee_drop * 0.2),
        "foot": (96, 184 - rise),
        "foot2": (144, 184 - rise),
    }


def pose(name: str, t: float) -> tuple[Joints, list[tuple[Point, Point]]]:
    extras: list[tuple[Point, Point]] = []
    if name == "bench":
        joints = blend(
            {
                "head": (176, 118),
                "shoulder": (150, 122),
                "hip": (92, 128),
                "hand": (138, 108),
                "hand2": (162, 108),
                "knee": (70, 140),
                "knee2": (70, 140),
                "foot": (48, 154),
                "foot2": (48, 154),
            },
            {
                "head": (176, 118),
                "shoulder": (150, 122),
                "hip": (92, 128),
                "hand": (138, 74),
                "hand2": (162, 74),
                "knee": (70, 140),
                "knee2": (70, 140),
                "foot": (48, 154),
                "foot2": (48, 154),
            },
            t,
        )
        extras.append(((70, 136), (184, 136)))
        return joints, extras
    if name == "incline":
        joints = blend(
            {
                "head": (168, 96),
                "shoulder": (146, 110),
                "hip": (96, 142),
                "hand": (132, 102),
                "hand2": (160, 96),
                "knee": (78, 160),
                "knee2": (78, 160),
                "foot": (62, 180),
                "foot2": (62, 180),
            },
            {
                "head": (168, 96),
                "shoulder": (146, 110),
                "hip": (96, 142),
                "hand": (150, 62),
                "hand2": (176, 56),
                "knee": (78, 160),
                "knee2": (78, 160),
                "foot": (62, 180),
                "foot2": (62, 180),
            },
            t,
        )
        extras.append(((88, 154), (176, 108)))
        return joints, extras
    if name == "press":
        return blend(standing(112), standing(42), t), extras
    if name == "pushup":
        joints = blend(
            {
                "head": (176, 96),
                "shoulder": (156, 104),
                "hip": (96, 112),
                "hand": (150, 142),
                "hand2": (168, 142),
                "knee": (72, 116),
                "knee2": (72, 116),
                "foot": (46, 120),
                "foot2": (46, 120),
            },
            {
                "head": (176, 78),
                "shoulder": (156, 86),
                "hip": (96, 94),
                "hand": (150, 142),
                "hand2": (168, 142),
                "knee": (72, 98),
                "knee2": (72, 98),
                "foot": (46, 102),
                "foot2": (46, 102),
            },
            t,
        )
        return joints, extras
    if name == "dip":
        return blend(standing(108), standing(146), t), extras
    if name == "raise":
        return blend(standing(120), standing(78), t), extras
    if name == "pullup":
        joints = blend(
            {
                "head": (120, 92),
                "shoulder": (120, 74),
                "hip": (120, 118),
                "hand": (96, 36),
                "hand2": (144, 36),
                "knee": (106, 146),
                "knee2": (134, 146),
                "foot": (102, 176),
                "foot2": (138, 176),
            },
            {
                "head": (120, 58),
                "shoulder": (120, 42),
                "hip": (120, 86),
                "hand": (96, 36),
                "hand2": (144, 36),
                "knee": (106, 116),
                "knee2": (134, 116),
                "foot": (102, 146),
                "foot2": (138, 146),
            },
            t,
        )
        extras.append(((84, 36), (156, 36)))
        return joints, extras
    if name == "pulldown":
        joints = blend(standing(58), standing(112), t)
        extras.append(((88, 40), (152, 40)))
        return joints, extras
    if name == "row":
        joints = blend(
            {
                "head": (156, 78),
                "shoulder": (142, 92),
                "hip": (96, 124),
                "hand": (150, 118),
                "hand2": (132, 124),
                "knee": (78, 150),
                "knee2": (78, 150),
                "foot": (64, 180),
                "foot2": (64, 180),
            },
            {
                "head": (156, 78),
                "shoulder": (142, 92),
                "hip": (96, 124),
                "hand": (126, 96),
                "hand2": (112, 102),
                "knee": (78, 150),
                "knee2": (78, 150),
                "foot": (64, 180),
                "foot2": (64, 180),
            },
            t,
        )
        return joints, extras
    if name == "face":
        return blend(standing(100), standing(78), t), extras
    if name == "curl":
        return blend(standing(128), standing(92), t), extras
    if name == "squat":
        return blend(standing(112, 0), standing(128, 28), t), extras
    if name == "deadlift":
        top = standing(96)
        bottom = {
            "head": (146, 96),
            "shoulder": (136, 110),
            "hip": (112, 138),
            "hand": (108, 162),
            "hand2": (128, 162),
            "knee": (100, 162),
            "knee2": (136, 162),
            "foot": (92, 184),
            "foot2": (148, 184),
        }
        return blend(bottom, top, t), extras
    if name == "hinge":
        top = standing(100)
        bottom = {
            "head": (158, 84),
            "shoulder": (146, 98),
            "hip": (112, 128),
            "hand": (132, 156),
            "hand2": (148, 150),
            "knee": (104, 156),
            "knee2": (136, 156),
            "foot": (96, 184),
            "foot2": (144, 184),
        }
        return blend(top, bottom, t), extras
    if name == "legpress":
        joints = blend(
            {
                "head": (62, 118),
                "shoulder": (78, 124),
                "hip": (104, 132),
                "hand": (70, 140),
                "hand2": (70, 140),
                "knee": (138, 118),
                "knee2": (138, 118),
                "foot": (168, 96),
                "foot2": (168, 112),
            },
            {
                "head": (62, 118),
                "shoulder": (78, 124),
                "hip": (104, 132),
                "hand": (70, 140),
                "hand2": (70, 140),
                "knee": (150, 104),
                "knee2": (150, 104),
                "foot": (184, 86),
                "foot2": (184, 102),
            },
            t,
        )
        extras.append(((176, 74), (176, 124)))
        return joints, extras
    if name == "lunge":
        top = standing(112)
        bottom = {
            "head": (120, 70),
            "shoulder": (120, 90),
            "hip": (120, 128),
            "hand": (100, 112),
            "hand2": (140, 112),
            "knee": (86, 156),
            "knee2": (142, 150),
            "foot": (70, 184),
            "foot2": (156, 184),
        }
        return blend(top, bottom, t), extras
    if name == "legcurl":
        joints = blend(
            {
                "head": (70, 108),
                "shoulder": (88, 116),
                "hip": (118, 124),
                "hand": (78, 132),
                "hand2": (78, 132),
                "knee": (150, 124),
                "knee2": (150, 124),
                "foot": (176, 146),
                "foot2": (176, 146),
            },
            {
                "head": (70, 108),
                "shoulder": (88, 116),
                "hip": (118, 124),
                "hand": (78, 132),
                "hand2": (78, 132),
                "knee": (150, 124),
                "knee2": (150, 124),
                "foot": (138, 104),
                "foot2": (138, 104),
            },
            t,
        )
        return joints, extras
    if name == "calf":
        return blend(standing(112, rise=0), standing(112, rise=14), t), extras
    if name == "plank":
        joints = {
            "head": (176, 108),
            "shoulder": (156, 112),
            "hip": (100, 116),
            "hand": (150, 140),
            "hand2": (168, 140),
            "knee": (74, 118),
            "knee2": (74, 118),
            "foot": (48, 120),
            "foot2": (48, 120),
        }
        return joints, extras
    if name == "crunch":
        joints = blend(
            {
                "head": (168, 124),
                "shoulder": (150, 128),
                "hip": (104, 136),
                "hand": (156, 116),
                "hand2": (140, 118),
                "knee": (84, 116),
                "knee2": (84, 116),
                "foot": (70, 100),
                "foot2": (70, 100),
            },
            {
                "head": (146, 96),
                "shoulder": (132, 110),
                "hip": (104, 136),
                "hand": (138, 96),
                "hand2": (122, 100),
                "knee": (84, 116),
                "knee2": (84, 116),
                "foot": (70, 100),
                "foot2": (70, 100),
            },
            t,
        )
        return joints, extras
    # hanging leg raise
    joints = blend(
        {
            "head": (120, 70),
            "shoulder": (120, 54),
            "hip": (120, 98),
            "hand": (100, 32),
            "hand2": (140, 32),
            "knee": (112, 132),
            "knee2": (128, 132),
            "foot": (108, 166),
            "foot2": (132, 166),
        },
        {
            "head": (120, 70),
            "shoulder": (120, 54),
            "hip": (120, 98),
            "hand": (100, 32),
            "hand2": (140, 32),
            "knee": (146, 92),
            "knee2": (156, 104),
            "foot": (168, 78),
            "foot2": (176, 96),
        },
        t,
    )
    extras.append(((88, 32), (152, 32)))
    return joints, extras


def draw_figure(draw: ImageDraw.ImageDraw, name: str, t: float) -> None:
    joints, extras = pose(name, t)
    for extra in extras:
        draw.line((*extra[0], *extra[1]), fill=BAR, width=5)
    for start, end in LINKS:
        draw.line((*joints[start], *joints[end]), fill=LIME, width=7)
    head = joints["head"]
    draw.ellipse((head[0] - 11, head[1] - 11, head[0] + 11, head[1] + 11), outline=LIME, width=5)


def render(title: str, name: str, t: float) -> Image.Image:
    image = Image.new("RGB", (SIZE, SIZE), BACKGROUND)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((14, 14, SIZE - 14, SIZE - 14), radius=32, outline=SOFT, width=2)
    draw_figure(draw, name, t)
    bbox = FONT.getbbox(title)
    text_width = bbox[2] - bbox[0]
    draw.text(((SIZE - text_width) / 2, 200), title, font=FONT, fill=LIME)
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    steps = [index / 5 for index in range(6)]
    for exercise_id, title, name in EXERCISES:
        frames = [render(title, name, step) for step in steps]
        frames[0].save(
            OUT / f"{exercise_id}.gif",
            save_all=True,
            append_images=frames[1:] + frames[-2:0:-1],
            duration=150,
            loop=0,
            optimize=True,
            disposal=2,
        )


if __name__ == "__main__":
    main()
