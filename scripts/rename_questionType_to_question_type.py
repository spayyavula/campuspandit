import sys
import csv

if len(sys.argv) != 3:
    print("Usage: python rename_questionType_to_question_type.py input.tsv output.tsv")
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
# Rename questionType to question_type if present
header = [h if h != 'questionType' else 'question_type' for h in header]

with open(output_file, 'w', encoding='utf-8', newline='') as fout:
    writer = csv.writer(fout, delimiter='\t')
    writer.writerow(header)
    for row in rows[1:]:
        writer.writerow(row)

print(f"Renamed questionType to question_type in {output_file}")
