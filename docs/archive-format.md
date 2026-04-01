# Analog Archive Format v1.0

This document describes the portable export format for Analog instances. The goal is to ensure that data remains readable and recoverable even without the Analog software stack.

## Export Artifact

The export is a standard ZIP file containing:

- `data.json` (or `takeout.json` for personal exports): A single JSON file containing all relational data.
- `media/`: A directory containing all raw media files.

## data.json Structure

The root object contains the following keys:

- `version`: The format version (e.g., "1.0").
- `exportedAt`: ISO 8601 timestamp of the export.
- `users`: Array of user profiles (redacted if personal export).
- `entries`: Array of top-level post aggregates.
- `revisions`: Array of all content versions for the entries.
- `comments`: All discussion posts.
- `likes`: Reaction records.
- `tags`: Descriptive labels.
- `media`: Metadata for all files, including their `s3Key` which matches the filename in the `media/` directory.

## Media Files

Media files are stored in the `media/` folder. The filename matches the base name of the `s3Key` stored in the database.

Example:
DB `s3Key`: `uploads/uuid-photo.jpg`
Zip path: `media/uuid-photo.jpg`

## Integrity

The `media` objects in `data.json` include a `sha256` field. This can be used to verify that files have not been corrupted during storage or transfer.

```bash
# Example verification
sha256sum media/uuid-photo.jpg
```
