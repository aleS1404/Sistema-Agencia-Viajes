from __future__ import annotations

import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPRINTS = ROOT / "docs" / "final" / "sprints"


def slug(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")[:55]


def extract(path: Path) -> list[Path]:
    lines = path.read_text(encoding="utf-8").splitlines()
    heading = "diagrama"
    index = 0
    outputs: list[Path] = []
    cursor = 0
    while cursor < len(lines):
        line = lines[cursor]
        match = re.match(r"^#{2,4}\s+(.+)$", line)
        if match:
            heading = match.group(1)
        if line.strip() in {"~~~mermaid", "```mermaid"}:
            end_marker = "~~~" if line.strip().startswith("~~~") else "```"
            body: list[str] = []
            cursor += 1
            while cursor < len(lines) and lines[cursor].strip() != end_marker:
                body.append(lines[cursor])
                cursor += 1
            index += 1
            output = path.parent / f"{index:02d}-{slug(heading)}.mmd"
            output.write_text("\n".join(body) + "\n", encoding="utf-8")
            outputs.append(output)
        cursor += 1
    return outputs


def main() -> None:
    all_outputs: list[Path] = []
    for source in sorted(SPRINTS.glob("sprint-*/diagramas/modelos-preliminares.md")):
        all_outputs.extend(extract(source))
    print(f"Diagramas extraídos: {len(all_outputs)}")
    for output in all_outputs:
        print(output.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
