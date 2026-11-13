# Eight-crop evidence and local rule review

Research checked 13 November 2026. Eight review sheets and sixteen distinct regional records are now prepared. These are sourced research candidates, **not approved agronomic recommendations**. Automated checks protect evidence integrity and prevent unreviewed model enablement; they do not establish agricultural accuracy.

| Crop | Review sheet | Evidence currently established |
| --- | --- | --- |
| Wheat | [Sheet](wheat.md) | Historical Lower Egypt and named-cultivar windows differ; preserve conditions |
| Barley | [Sheet](barley.md) | Irrigated Lower Egypt candidate; hosting authority still needs confirmation |
| Faba bean | [Sheet](faba_bean.md) | Historical guidance distinguishes Lower Egypt and explicitly named Fayoum |
| Berseem | [Sheet](berseem.md) | FAO distinguishes averaged cutting effects and individual cuts; local sowing/cutting calendar unresolved |
| Maize | [Sheet](maize.md) | Historical broad growing context; no universal optimum adopted |
| Grain sorghum | [Sheet](sorghum.md) | Historical source explicitly names Fayoum; Delta applicability unresolved |
| Soybean | [Sheet](soybean.md) | Historical sowing range; ARC bulletin full-text retrieval failed and must be reconciled |
| Sunflower | [Sheet](sunflower.md) | Multiple planting cycles and conditional maturity range; field release differs from maturity |

The canonical research record is [crop-rule-evidence.json](../../../data/manifests/crop-rule-evidence.json). Rebuild and check from the repository root:

```sh
python3 scripts/data/render_crop_rule_sheets.py
python3 scripts/data/validate_crop_rules.py
python3 -m unittest discover -s tests/data -p 'test_*.py'
```

## Evidence policy

- A source-supported candidate means its statement was read, not that it is suitable for every farm. Source age, geographic scope, cultivar and harvest use remain attached.
- The textbook was published in 2007 by Ain Shams authors and hosted by Fayoum University. Hosting at Fayoum is not proof that every recommendation applies to Fayoum. Its SHA-256 is retained; the full copyrighted book stays outside Git.
- Search-only ARC snippets are discovery leads. Failed full-text access is recorded and such leads cannot be promoted to source-supported numeric rules.
- Month, week and day precision stay distinct. A first-week reference is not converted to an invented exact date. Conditional or different-source windows must not be averaged into a universal recommendation.
- FAO-56 Tables 11/12 are methodological references. Generic stage lengths or Kc cannot be copied into a local crop model without reviewing conditions, crop habit, harvest purpose, wetting frequency and climate adjustments. Berseem hay reference coefficients need an explicit applicability review for the selected fresh-forage management.
- No universal family-repeat ban, nitrogen credit, yield effect, guaranteed water saving or economic return is inferred from a crop's family or its satellite signature.

## Finish a local rule before enabling it

For each crop and region, a reviewer must establish the cultivar/harvest use, sowing window, growth-stage lengths, field-clearance date, soil/water restrictions, rotation restrictions and water-accounting method, citing sources for each field. Region-specific approval must be explicit; Delta approval cannot silently approve Fayoum.

Field clearance must account for harvesting and operations before the next crop. Multi-cut forage requires actual last-cut/termination rules. Supply and demand must use the same field-inlet boundary and time interval. Salinity and drainage conditions require farmer/local evidence: the seven environmental datasets do not supply measured field salinity or the farmer's irrigation allocation.

All approvedRules remain null and all modelEnabled flags remain false at this stage. This protects the future engine from treating partial evidence as feasibility. The current deliverable makes each missing rule and its research task visible; it does not claim the scientific review has occurred.
