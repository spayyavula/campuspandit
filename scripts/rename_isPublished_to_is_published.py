import sys
import csv

if len(sys.argv) != 3:
    print("Usage: python rename_isPublished_to_is_published.py input.tsv output.tsv")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, 'r', encoding='utf-8') as fin:
    reader = csv.reader(fin, delimiter='\t')
    rows = list(reader)

if not rows:
    print("Input file is empty.")
    sys.exit(1)

header = rows[0]
# Rename isPublished to is_published if present
header = [h if h != 'isPublished' else 'is_published' for h in header]

with open(output_file, 'w', encoding='utf-8', newline='') as fout:
    writer = csv.writer(fout, delimiter='\t')
    writer.writerow(header)
    for row in rows[1:]:
        writer.writerow(row)

print(f"Renamed isPublished to is_published in {output_file}")
