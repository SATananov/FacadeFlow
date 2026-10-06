# KMG Official Package Audit 01

## Scope

This is a read-only package comparison between the current official KMG Altest download and the legacy extraction at `C:\Users\stana\Desktop\AltestExtract`.

The audit covers package archaeology only. It does not modify runtime geometry, infer physical joint geometry, or promote database relationships to geometry evidence.

## Official package

- Displayed package: `KMG Altest – 20.02.2026 г.`
- Download URL: `https://skyglazing.com/downloads/2018/Altest.EXE`
- Installer: `C:\Users\stana\Desktop\KMG_Altest_Current_Audit01\Altest.EXE`
- Size: `2,711,107` bytes
- SHA-256: `262B3545D477BC33FA10AD7ABFC4370FE0F4E332425189F0205012817555A285`
- Type: Wise-style executable installer
- Extraction: `C:\Users\stana\Desktop\KMG_Altest_Current_Extract`

The download was extracted with the installer's `/X` extraction mode. No package file was copied into the repository.

## Package inventory comparison

Both packages contain nine files. Both contain only `.mdb` files and no subdirectories.

Unchanged files, byte-identical by SHA-256:

- `%APROFDB%.mdb`
- `%APROFDB%_%COUNT1%.mdb`
- `ConfigAltest.mdb`
- `Glasses.mdb`
- `Glasses_%COUNT1%.mdb`

Changed files:

| File | Current SHA-256 | Legacy SHA-256 |
|---|---|---|
| `Offers.mdb` | `9EB027395685E7E835E87E8D6615E052C769E76C115086EFA318DAB58E3E629D` | `6F53AF609721818DFDAC17E5C631111F183F4969641038A8351C4D9956046BE7` |
| `Offers_%COUNT1%.mdb` | `9EB027395685E7E835E87E8D6615E052C769E76C115086EFA318DAB58E3E629D` | `BADE5B7E9CD826A5DDBA29691833D36CD0CAE2EDDDB7EE7F28062AB5522564FD` |
| `Stock.mdb` | `10B3EFB79A22CCD3C20C16490B04AEFD7653EC052D9648A41CB42EAB02594CF1` | `1DD22217477111D29F4930EE152A5B0F4178DF3C9DF56A26A9FB7ED1D5ADCFFB` |
| `Stock_%COUNT1%.mdb` | `10B3EFB79A22CCD3C20C16490B04AEFD7653EC052D9648A41CB42EAB02594CF1` | `095E8D00AC8F43DAEF8240E82E8AC710091C19E688137F6CF40CBD4088A2ADD1` |

There are no new files, removed files, or new file types. The changed Offers/Stock databases do not contain the target profile-system database tables.

## MDB comparison

The current and legacy `%APROFDB%.mdb` files are byte-identical:

`2C0CAFADB2AE362C33711DF93394765C0CCCC5377E5064BE1F60E5758130BDA7`

The main database was inspected with 32-bit PowerShell and `Microsoft.Jet.OLEDB.4.0`. Its relevant tables include `items`, `standardoperations`, `standart`, `workoperations`, `workoperationsset`, `operations_mecal*`, `profset`, `subtypes`, and `systems`-related tables. The current and legacy target records therefore have no package-version difference.

### 482.20

Classification: `UNCHANGED_LEGACY_EVIDENCE` / `NEW_DATABASE_PROFILE_EVIDENCE` is **not** applicable.

The exact `items` row is present in both byte-identical main databases:

- id `482.20`
- catalog `PVC KMG 60mm`
- name `Каса KMG 4к`
- type `1`, subtype `1`
- `profileW=60`, `profileZ=68`
- `dim_in=46`, `dim_out=0`
- `cuttingang=45`
- `maker_code=54433281471`
- `cadfile` empty
- `operations` and `workoperations` empty
- system id `2`

These fields are database/profile evidence only. They do not prove the frame-to-mullion contact geometry.

### 482.21

Classification: `UNCHANGED_LEGACY_EVIDENCE` / `NEW_DATABASE_PROFILE_EVIDENCE` is **not** applicable.

The exact `items` row is present in both byte-identical main databases:

- id `482.21`
- catalog `PVC KMG 60mm`
- name `Делител KMG 4к`
- type `3`, subtype `3`
- `profileW=60`, `profileZ=84`
- `dim_in=40`, `dim_out=22`
- `cuttingang=45`
- `maker_code=50433261597`
- `cadfile` empty
- `operations` and `workoperations` empty
- system id `2`

These fields do not prove a physical assembly, contact depth, overlap, rebate, notch, or machining contour.

### KM242

Classification: `UNCHANGED_LEGACY_EVIDENCE` / `NEW_DATABASE_RELATIONSHIP_EVIDENCE` is **not** applicable.

The exact `items` row is present in both byte-identical main databases:

- id `KM242`
- catalog `KMG`
- name `Сглобка за дел. KMG 4к`
- type `4`, subtype `4`
- relation `1`
- `maker_code=41446284477`
- `cuttingang=90`
- `cadfile` empty
- profile dimensions `0/0`
- variable `WorkOperationsSet=Обков PVC делител`

This identifies an accessory/database item. It does not show its physical shape or placement and is not a joint drawing.

## Operation comparison

The main database is unchanged between current and legacy packages.

`BeamHorizontalKMG4k` and `BeamVerticalKMG4k` remain database relationship evidence. Their accessory strings contain:

```text
L_Fr;19;SglobkaDelitel;POS[];0;MM1
R_Fr;19;SglobkaDelitel;POS[];0;MM4
U_Fr;19;SglobkaDelitel;POS[];0;MM1
D_Fr;19;SglobkaDelitel;POS[];0;MM1
```

The related `standardoperations` rows are unchanged. No new exact-pair binding, physical operation documentation, or explicit geometry semantics were found. `SglobkaDelitel`, operation `19`, `POS[]`, `MM1`, `MM4`, and the directional tokens remain `DATABASE_RELATIONSHIP_EVIDENCE` only.

The machine-operation tables `operations`, `operations_emmegi`, `operations_mecal`, `operations_mecalbase`, and `operationsurban` contain no target machining definition that supplies physical joint geometry. The small `operations_mecal_toolmap` table is not a profile-pair assembly source.

## Configuration and source references

The `standart` records contain KMG relationship/configuration text, including references to `482.20`, `482.21`, `KMG 4K`, and `KMG 4K - каса от делител`. These are database relationship/configuration evidence, not assembly geometry.

KMG configuration variables reference certification/document filenames, including:

- `ДЕП 60мм window.pdf`
- `ISO_KMG_2026 bg.pdf`
- `ELTRAL високо отваряне сертификат.pdf`
- `ENDOW.pdf`
- `Розенхайм KMG 60мм.pdf`
- `Серт. Endow на БГ.pdf`
- `Сертификат Метал.pdf`
- `Серт.обков GU.pdf`

Those files were not present in the extracted current package. The references are `SOURCE_REFERENCE_ONLY` / `SOURCE GAP`; they are not evidence of the frame-to-mullion assembly.

The target `items.cadfile`, `items.pdf_help_file`, and related target CAD/help fields are empty. The current package contains no PDF, DXF, DWG, CAD, CHM, HLP, HTML, image, or other graphical-help asset.

## Evidence conclusion

No `PRIMARY_GEOMETRY_EVIDENCE`, `PRIMARY_ASSEMBLY_GEOMETRY_EVIDENCE`, or new manufacturer technical source was found.

The audit found no new evidence for:

- 482.20 ↔ 482.21 assembly drawing
- exact frame-to-mullion cross-section
- contact surfaces or contact depth
- overlap or rebate
- mullion-end notch
- machining dimensions
- cut angle or cut length
- KM242 drawing or placement

All such facts remain `UNKNOWN`. No source was found that justifies updating `geometryEvidence.ts`.

## Recommended next source

Recover the missing referenced certification/technical PDFs and any original KMG fabrication package containing a frame-to-mullion assembly sketch, KM242 installation detail, or manufacturer CAD/machining drawing. Until one of those direct sources is obtained, retain the existing database relationship evidence without promoting it to physical geometry evidence.
