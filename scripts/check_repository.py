"""Small dependency-free repository skeleton/link checker for the pivot branch."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "README.md", "AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md",
    ".github/ISSUE_TEMPLATE/task.md", ".github/pull_request_template.md",
    "docs/STATUS.md", "docs/README.md", "docs/product/PRD.md",
    "docs/data/DATA_PLAN.md", "docs/engineering/ARCHITECTURE.md",
    "docs/engineering/CONTRACTS.md", "docs/team/TEAM.md",
    "docs/team/WORKSTREAMS.md", "docs/team/HANDOFF_TEMPLATE.md",
    "docs/decisions/README.md", "docs/decisions/TEMPLATE.md",
    "docs/delivery/PLAN.md", "docs/challenge/VERIFICATION.md",
    "docs/brand/IDENTITY.md", "docs/brand/COLORS.md",
    "contracts/README.md", "data/README.md", "web/README.md",
]
errors = []
for name in REQUIRED:
    if not (ROOT / name).is_file():
        errors.append(f"Missing skeleton file: {name}")
checked = 0
for file in ROOT.rglob("*.md"):
    if any(part in {".git", "node_modules", ".venv"} for part in file.relative_to(ROOT).parts):
        continue
    content = re.sub(r"\x60\x60\x60.*?\x60\x60\x60", "", file.read_text(encoding="utf-8"), flags=re.S)
    for match in re.finditer(r"!?\[[^\]]*\]\(([^)\s]+)(?:\s+['\"][^'\"]*['\"])?\)", content):
        url = match.group(1).strip("<>")
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        checked += 1
        destination = (file.parent / unquote(parsed.path)).resolve()
        if not destination.is_relative_to(ROOT) or not destination.exists():
            errors.append(f"{file.relative_to(ROOT)}: missing link {url}")
if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"PASS: {len(REQUIRED)} skeleton files and {checked} local Markdown links")
