from imagededup.methods import PHash

class PHashMatcher:
    def __init__(self, threshold=5):
        self.phasher = PHash()
        self.threshold = threshold

    def encode(self, image_path):
        """Return pHash encoding for a single image."""
        return self.phasher.encode_image(image_path)

    def compare(self, target_encoding, candidate_encoding):
        """Return distance between two encodings."""
        return self.phasher.compute_distance(target_encoding, candidate_encoding)

    def is_match(self, distance):
        """Check if distance ≤ threshold."""
        return distance <= self.threshold

    def find_matches(self, target_path, candidate_paths):
        """Compare target against multiple candidates."""
        target_encoding = self.encode(target_path)
        results = []

        for cand in candidate_paths:
            cand_encoding = self.encode(cand)
            distance = self.compare(target_encoding, cand_encoding)
            match = self.is_match(distance)

            results.append({
                "candidate": cand,
                "distance": distance,
                "match": match
            })

        return results