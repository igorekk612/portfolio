"""Generuje miniatury katalogu z podglądu 3D (nick „KubaGG”).
Użycie:  npm run build:demo  &&  pip install playwright pillow  &&  python -m playwright install chromium
         python scripts/make-thumbs.py
Wynik: src/assets/katalog/<produkt>--<wariant>.jpg (albo <produkt>.jpg, gdy produkt nie ma wariantów).
Po dodaniu produktu lub wariantu dopisz go do listy ENTRIES."""
import asyncio, os, pathlib
from playwright.async_api import async_playwright
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets' / 'katalog'
DEMO = (ROOT / 'dist-demo' / 'index.html').as_uri()
ENTRIES = [("uchwyt", "klasyczny"), ("uchwyt", "podwojny"), ("uchwyt", "scienny"), ("sluchawki", None), ("telefon", None),
           ("brelok", "zawieszka"), ("brelok", "niesmiertelnik"), ("organizer", "trzy"), ("organizer", "pady"), ("organizer", "maly"),
           ("zestaw", None), ("zestaw-biurko", None), ("tabliczka", "prosta"), ("tabliczka", "ramka"), ("tabliczka", "pikselowa"), ("podkladka", None)]

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={"width": 1100, "height": 900})
        for pid, v in ENTRIES:
            await pg.goto(f"{DEMO}#/produkt/{pid}" + (f"?wariant={v}" if v else ""))
            await pg.wait_for_timeout(2600)
            name = f"{pid}--{v}" if v else pid
            tmp = OUT / f"_{name}.png"
            await pg.locator(".preview3d").first.screenshot(path=str(tmp))
            im = Image.open(tmp).convert("RGB"); w, h = im.size
            im = im.crop((0, 0, w, int(h * 0.92))); im = im.resize((640, int(640 * im.height / im.width)))
            im.save(OUT / f"{name}.jpg", quality=78); os.remove(tmp)
            print("ok", name)
        await b.close()

asyncio.run(main())
