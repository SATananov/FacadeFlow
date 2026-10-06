# GEOMETRY EVIDENCE ACQUISITION 04 — EXTERNAL SOURCE SEARCH

Scope: KMG PRELUDE 60 `482.20` Frame / `482.21` Mullion, exact
`FRAME_TO_MULLION` assembly evidence, with follow-up on `KM242`.

This report records externally inspected public sources only. No external
binary was copied into the repository, and no physical joint geometry was
inferred or promoted.

## Strongest external source

- URL: `https://altestgroup.com/pdf/system/39/bg.pdf`
- Title: `KMG PVC WINDOWS & DOORS SYSTEMS`
- Organization: Altest / KMG
- Document type: manufacturer-hosted technical catalogue PDF
- Indexed document length: 6 PDF pages
- Relevant catalogue page: page 2 contains the isolated main-profile drawings
  for `482.20` Frame and `482.21` Mullion.
- Relevant catalogue page: page 3 contains the reinforcement/accessory sheet;
  it labels `KM242` as `mullion connector for 482.21`.
- Document date/version: not stated in the inspected page metadata.
- Local SHA-256: not computed for the public URL because the file was not
  downloaded; the authoritative local recovered PDF remains
  `PVC Prelude_bg.pdf` with SHA-256
  `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`.

Classification by fact:

- Isolated profile sections: `PRIMARY_MANUFACTURER_PROFILE_EVIDENCE`.
- KM242 identity as a connector for 482.21:
  `PRIMARY_MANUFACTURER_CONNECTOR_EVIDENCE`.
- Exact 482.20 ↔ 482.21 assembly: not present.

The source directly proves profile identity/callout material and the KM242
label. It does not prove KM242 shape, placement, contact surfaces, contact
depth, overlap, rebate, notch contour, cut angle, cut length, machining
dimensions, or an assembled 482.20 ↔ 482.21 cross-section.

## Other external sources

| URL | Title / organization | Relevant reference | Direct result | Classification |
| --- | --- | --- | --- | --- |
| `https://www.scribd.com/document/96687366/kmg` | `KMG PVC Profiles Technical Catalogue`, user-hosted copy; catalogue text identifies 2008 pages | Pages 12–20 list section combinations; page 17 indexes `S-482.04` / `S-482.21` with `S-482.02` / `S-482.19`; pages 18–20 show `S-482.03` / `S-482.20` with other components | Older section references exist, but no indexed section combines `S-482.20` and `S-482.21`; provenance is secondary and the page text does not document the requested joint | `SECONDARY_TECHNICAL_REFERENCE` |
| `https://visionplast.com/wp-content/uploads/2019/07/pvc_kmg.pdf` | `New KMG Brochure`, distributor/reseller-hosted PDF copy | Lists PRELUDE profiles and describes KM242 as `Joint T 60mm Eco for frame with gasket` | Connector description only; no drawing or placement detail | `SECONDARY_TECHNICAL_REFERENCE` |
| `https://carega.ro/files/KMG-pliant.pdf` | `pvc-final`, reseller-hosted PDF copy | Lists isolated profile drawings and KM242 accessory description | Same brochure-level evidence; no exact assembly detail | `SECONDARY_TECHNICAL_REFERENCE` |
| `https://europrof.ro/ro/files/catalogs/profile-pvc.pdf` | `PVC WINDOWS & DOORS SYSTEMS`, distributor/reseller-hosted catalogue copy | Repeats PRELUDE profile, reinforcement, and KM242 listings | No exact pair assembly or KM242 placement drawing | `SECONDARY_TECHNICAL_REFERENCE` |
| `https://altestgroup.com/en/system/39` | `PVC Prelude`, Altest product page | Identifies the KMG Prelude product family and manufacturer context | No profile-pair section or machining documentation | `SOURCE_REFERENCE_ONLY` |
| `https://altestgroup.com/en/downloads` | Altest downloads page | Public downloads landing page inspected | No additional indexed assembly/CAD/machining source found | `SOURCE_REFERENCE_ONLY` |
| `https://carpinteriaalupvcaltest.jimdofree.com/carpinter%C3%ADa-altest/pvc/` | Altest-related reseller page | Links a `Profils PVC Prelude 60mm.pdf` copy | The page does not expose an exact pair assembly detail or verified manufacturer-hosted file provenance | `SECONDARY_TECHNICAL_REFERENCE` |

Searches for focused profile/CAD terms did not find a public KMG
482.20/482.21 DXF, DWG, CAD library item, machining sheet, assembly manual, or
KM242 drawing. Irrelevant numeric matches and unrelated CAD results were
excluded.

## Target evidence status

| Field | Status | Result |
| --- | --- | --- |
| 482.20 ↔ 482.21 assembly drawing | `MISSING` | No direct assembled pair found |
| Frame↔mullion cross-section | `PARTIAL` | Manufacturer source has isolated sections; secondary catalogue has related, not exact, section pages |
| KM242 drawing | `MISSING` | Only labelled/illustrated accessory listing, no usable physical drawing |
| KM242 placement | `MISSING` | No source shows where it sits in the target pair |
| Contact surfaces | `MISSING` | Not documented for the target pair |
| Contact depth | `MISSING` | Not documented |
| Overlap | `MISSING` | Not documented; no envelope arithmetic used |
| Rebate | `MISSING` | Not documented by these sources |
| Mullion end notch | `MISSING` | No machining/end-treatment detail |
| Machining dimensions | `MISSING` | No target-pair fabrication sheet |
| Cut angle | `MISSING` | No direct source |
| Cut length | `MISSING` | No direct source |

All exact-pair physical fields remain `UNKNOWN` in the geometry-evidence model.
`SglobkaDelitel`, `BeamHorizontalKMG4k`, `BeamVerticalKMG4k`, operation `19`,
`POS[]`, `MM1`, and `MM4` remain database relationship evidence only.

## Source gaps and next source

- An indexed manufacturer download portal exists, but no public exact-pair
  assembly or CAD file was exposed by the inspected page.
- Public copies of the catalogue preserve profile and accessory labels but do
  not add physical joint evidence.
- The required source is an original KMG/Altest fabrication or assembly detail
  that labels both `482.20` and `482.21` and shows KM242 in section, preferably
  with machining dimensions or an associated CAD/DXF/DWG file.
