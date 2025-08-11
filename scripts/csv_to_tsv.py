import csv
import sys

# Usage: python csv_to_tsv.py input.csv output.tsv
if len(sys.argv) != 3:
    print('Usage: python csv_to_tsv.py input.csv output.tsv')
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    rows = list(reader)

with open(output_file, 'w', encoding='utf-8', newline='') as tsvfile:
    for row in rows:
        tsvfile.write('\t'.join(row) + '\n')

print(f'Converted {input_file} to {output_file} (TSV format)')
