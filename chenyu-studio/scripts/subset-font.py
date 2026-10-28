"""Local-only Chinese font subsetting. pip install 'fonttools[woff]' first."""
from pathlib import Path
import re
from fontTools import subset

root = Path(__file__).resolve().parents[1]
text = ''.join(p.read_text() for p in (root / 'src').rglob('*') if p.is_file())
chars = ''.join(sorted(set(re.findall('[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]', text))))
options = subset.Options()
options.flavor = 'woff2'
font = subset.load_font(str(root / 'asset-sources/noto-sans-sc.ttf'), options)
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=chars)
subsetter.subset(font)
subset.save_font(font, str(root / 'public/fonts/studio-sans.woff2'), options)
print(f'Created a local subset with {len(chars)} Chinese characters.')
