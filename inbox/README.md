The scheduled Nirnay Daily tasks drop new editions here as JSON files.
GitHub Actions (.github/workflows/ingest.yml) applies them to data/ with tools/ingest.py and removes them.
Files that cannot be applied are moved to inbox/failed/ and listed in data/ingest-log.json.
