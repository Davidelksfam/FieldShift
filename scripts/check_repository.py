"""Dependency-free checks for the repository's shared context."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    'README.md', 'AGENTS.md', 'CLAUDE.md', 'CONTRIBUTING.md',
    '.github/copilot-instructions.md', 'docs/STATUS.md',
    'docs/challenge/BRIEF.md', 'docs/challenge/VERIFICATION.md',
    'docs/product/PRD.md', 'docs/data/DATA_PLAN.md',
    'docs/engineering/ARCHITECTURE.md', 'docs/team/TEAM.md',
    'docs/team/HANDOFF_TEMPLATE.md', 'docs/decisions/TEMPLATE.md',
    'docs/delivery/PLAN.md', 'docs/AI_USAGE.md',
    'docs/reference/Field_Shift_Complete_Strategy_Guide.md',
    'docs/reference/original-repository-readme.md',
    'docs/brand/IDENTITY.md', 'docs/brand/COLORS.md',
)
errors = []
for name in REQUIRED:
    if not (ROOT / name).is_file():
        errors.append(f'Missing context file: {name}')
# Temporary user-requested placeholders. Remove this assertion when content is authorized.
for name in ('IDENTITY.md', 'COLORS.md'):
    path = ROOT / 'docs/brand' / name
    if path.exists() and path.stat().st_size:
        errors.append(f'Brand placeholder must remain empty: {path.relative_to(ROOT)}')

checked = 0
for path in ROOT.rglob('*.md'):
    relative = path.relative_to(ROOT)
    if any(part in {'.git', 'node_modules', '.venv', 'work'} for part in relative.parts):
        continue
    # Historical snapshots retain their original relative links and formatting.
    if relative.parent == Path('docs/reference') and path.name != 'README.md':
        continue
    content = re.sub(r'```.*?```', '', path.read_text(), flags=re.S)
    for match in re.finditer(r'!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)', content):
        target = match.group(1).strip('<>')
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        checked += 1
        destination = (path.parent / unquote(parsed.path)).resolve()
        if not destination.is_relative_to(ROOT) or not destination.exists():
            errors.append(f'{relative}: missing/escaping local link: {target}')

if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'PASS: {len(REQUIRED)} required files, {checked} local links, empty brand placeholders')
print('Archived source snapshots excluded from link checks; external URLs and anchors not validated.')
