# Data manifests — data engineer

Document every retrieved input: exact source/product/version, retrieval date, observation dates, query and spatial support, units, checksum/size, license, missing-data/quality-flag handling, and the preprocessing command. This directory holds **metadata**, never credentials or large downloads.

The [source registry](source-registry.json) and `research-runs/` contain actual bounded research acquisition/access records. See [download status](../../docs/data/DOWNLOAD_STATUS.md) and [connection guide](../../docs/data/DATASET_ACCESS_GUIDE.md). A `catalog` artifact is metadata, not measurements. A science download requires a `science` artifact with byte count/hash and successful validation; blocked sources remain explicitly marked. Raw files named in records are ignored local files and are absent from a fresh clone.
