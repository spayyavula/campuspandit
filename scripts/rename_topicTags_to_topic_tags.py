import sys
import csv

# Usage: python rename_topicTags_to_topic_tags.py input.tsv output.tsv
if len(sys.argv) != 3:
    print("Usage: python rename_topicTags_to_topic_tags.py input.tsv output.tsv")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, 'r', encoding='utf-8') as fin:
    reader = csv.DictReader(fin, delimiter='\t')
    fieldnames = [fn if fn != 'topicTags' else 'topic_tags' for fn in reader.fieldnames]
    rows = []
    for row in reader:
        # Move topicTags to topic_tags if present
        if 'topicTags' in row:
            row['topic_tags'] = row['topicTags']
            del row['topicTags']
        rows.append(row)

with open(output_file, 'w', encoding='utf-8', newline='') as fout:
    writer = csv.DictWriter(fout, fieldnames=fieldnames, delimiter='\t')
    writer.writeheader()
    writer.writerows(rows)

print(f"Renamed 'topicTags' to 'topic_tags' in {output_file}")
