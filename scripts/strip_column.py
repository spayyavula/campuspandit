import sys
import csv

if len(sys.argv) != 3:
    print("Usage: python strip_column.py <input_file.tsv> <output_file.tsv>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]
column_to_remove = 'analytics'

with open(input_file, 'r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile, delimiter='\t')
    headers = [h for h in reader.fieldnames if h != column_to_remove]
    rows = []
    for row in reader:
        row.pop(column_to_remove, None)
        rows.append(row)

with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
    writer = csv.DictWriter(outfile, fieldnames=headers, delimiter='\t')
    writer.writeheader()
    writer.writerows(rows)

print(f"Column '{column_to_remove}' removed. Output written to {output_file}")
