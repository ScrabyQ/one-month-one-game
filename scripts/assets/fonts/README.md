# Artwork fonts

These files are build assets used by `scripts/lib/artwork-renderer.ts`. They are
outside `public/` and are not copied into the deployed website. The renderer
loads only these files and disables discovery of system fonts.

| File | Use | Source and terms |
| --- | --- | --- |
| Montserrat-ExtraBold.ttf | Large background round labels and numbers, weight 800 | [Montserrat](https://github.com/JulietaUla/Montserrat/blob/master/fonts/ttf/Montserrat-ExtraBold.ttf); see Montserrat-OFL.txt |
| CascadiaCode-Regular.ttf | Dates and small regular labels, weight 400 | Static instance of the installed Cascadia Code; [upstream](https://github.com/microsoft/cascadia-code); see CascadiaCode-LICENSE.txt |
| CascadiaCode-Bold.ttf | Small bold labels, weight 700 | Static instance of the same Cascadia Code; see CascadiaCode-LICENSE.txt |
| Arial-Bold.ttf | Challenge label, weight 700 | Installed Windows `arialbd.ttf`; original Microsoft/Monotype terms in Arial-Bold-NOTICE.txt |
| Arial-Black.ttf | Main headings, themes and participant count, weight 900 | Installed Windows `ariblk.ttf`; original Microsoft/Monotype terms in Arial-Black-NOTICE.txt |

The original SVG's generic `monospace` selected different families for different
weights: Cascadia Code for regular/bold text and Montserrat ExtraBold for the
large weight-800 text. Both are now named explicitly. The old Arial weight-800
labels resolved to Arial Bold; their explicit weight is now 700.

The fonts retain their individual licenses; inclusion here does not change or
extend those terms. Do not replace them with similarly named system versions.

The original round-002 background is preserved as a small test fixture in
`tests/fixtures/artwork-fonts/`. It protects the original glyph shapes, while a
separate test verifies that host font settings cannot change the rendered PNG.
