# Biometric & Image Privacy

- **Images are not stored** unless the user explicitly opts in (`save_raw`).
- **Process in memory**: face and body pipelines run on the uploaded buffer; results (FaceProfile, BodyProfile) are stored in the session only.
- **Raw images are deleted** after feature extraction; the session holds only vectors/measurements and quality_gates.
- **Session store** is in-memory (no raw image persistence); sessions can be pruned with `pruneSessionsOlderThanMs()`.

API responses return only structured profiles (color_season, kibbe_cluster, measurements, confidence). No image URLs or raw data are returned unless the client explicitly requested save.
