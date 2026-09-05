/**
 * Tax Normalizer
 * Responsible for merging imported tax information into the internal profile,
 * while preventing duplicate records based on source_reference.
 */

class TaxNormalizer {
  /**
   * Merges an array of new records into an existing array, skipping duplicates.
   * @param {Array} existingRecords 
   * @param {Array} newRecords 
   * @returns {Array} Merged array
   */
  static deduplicate(existingRecords, newRecords) {
    const merged = [...(existingRecords || [])];
    const existingRefs = new Set(merged.map(r => r.metadata?.source_reference).filter(Boolean));

    for (const record of newRecords) {
      if (record.metadata && record.metadata.source_reference) {
        if (!existingRefs.has(record.metadata.source_reference)) {
          merged.push(record);
          existingRefs.add(record.metadata.source_reference);
        }
      } else {
        // Fallback for records without strict metadata (e.g., user-provided array items)
        merged.push(record);
      }
    }
    return merged;
  }

  /**
   * Normalizes TDS records into a cumulative profile value
   * (In a real app, this would be an array, but for our simple profile, we sum it up if needed)
   * @param {Array} records 
   */
  static calculateTotalTDS(records) {
    return records.reduce((sum, r) => sum + (r.value?.amount || 0), 0);
  }
}

module.exports = TaxNormalizer;
