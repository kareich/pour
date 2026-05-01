# Seed Data Files

This directory holds the raw data files consumed by `apps/workers/src/seeds/`.
**None of these files are committed** — download them before running the seed pipeline.

| File | Source | Notes |
|------|--------|-------|
| `ttb-cola.csv` | https://www.ttb.gov/public-data/cola-registry | US spirit label registry (~200K rows). Filter: distilled spirits only. |
| `openfoodfacts.csv` | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv | Tab-delimited (~3 GB). Spirits subset only; seed script filters in-process. |
| `lcbo-products.csv` | https://data.ontario.ca/dataset/lcbo-product-assortment | LCBO open product catalogue. Filter: PRIMARY_CATEGORY = SPIRITS. |
| `wslcb-price-list.tsv` | https://www.lcb.wa.gov/licensing/spirits-price-lists | Washington State spirits price list. Tab-delimited, published monthly. |

## Running the pipeline

```bash
# All steps (requires all four files above)
pnpm --filter workers run seed:all

# Individual steps
pnpm --filter workers run seed:ttb
pnpm --filter workers run seed:openfoodfacts
pnpm --filter workers run seed:lcbo
pnpm --filter workers run seed:wslcb

# Skip optional steps
pnpm --filter workers run seed:all -- --skip-r2 --skip-typesense
```

## Targets

- 40 K+ spirit records
- 25 K+ barcode mappings (EAN-13 / UPC-A, check-digit validated)
- 15 K+ records with ABV
- < 30 minutes on a laptop
