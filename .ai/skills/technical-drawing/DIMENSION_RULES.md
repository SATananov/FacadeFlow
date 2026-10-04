# Technical Dimension Presentation Rules

## General

- Keep the technical sketch clean. Do not place “Прозорец,” “Врата,” `WINDOW_REGION`, `DOOR_REGION`, or width × height pills inside functional-region geometry.
- Semantic names and current field dimensions belong in the inspector and bottom field cards.
- Dimension values and extension lines must come from actual explicit/resolved geometry. Never use example values as defaults.
- Dimension chains normally remain stable under selection and follow existing zoom/collision handling.

## Horizontal chains

- Place individual adjacent-region widths on the first chain close to the sketch.
- Place overall module width on a separate farther outer chain.
- For three regions, show each individual width and then total width.
- Do not assign a physical width to ZERO_DIVIDER.

## Vertical dimensions

- Avoid stacking all heights on one side.
- For window-left / door-right, associate window height with the outer left side of the window and door height with the outer right side of the door; place overall maximum height farther outside when needed.
- Mirror placement logically for the reversed layout. For multiple regions, choose a readable non-overlapping side based on actual order.
- Avoid redundant duplicate height dimensions where overall maximum and region height communicate the same value without adding a distinct meaning; preserve distinct semantic information where needed.
- Each region height terminates at that region’s actual edge. Overall maximum height spans the union’s actual extreme edges.
- Do not dimension exterior void as product.

## Technical line conventions

- Extension lines originate at actual geometry edges.
- Keep dimensions outside product geometry and separate the region chain from the overall chain.
- Do not dimension ZERO_DIVIDER as physical width.
- Use drawing-space conventions so layout remains coherent across zoom; do not encode production facts in visual offsets.

All numeric examples are EXAMPLE ONLY. See [combined module rules](COMBINED_DOOR_WINDOW_RULES.md).
