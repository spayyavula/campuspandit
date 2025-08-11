import sys
import csv

REQUIRED_HEADERS = [
    'id','title','content','questionType','difficulty','subject','board','grade',
    'topicTags','marks','timeLimit','isPublished','created_at','updated_at'
]

RENAME_MAP = {
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
}

def main():
    if len(sys.argv) != 3:
        print("Usage: python rename_columns.py <input_file.tsv> <output_file.tsv>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile, delimiter='\t')
        rows = list(reader)

    # Rename columns in each row
    for row in rows:
        for old, new in RENAME_MAP.items():
            if old in row:
                row[new] = row.pop(old)

    # Only keep required columns and add missing ones as empty
    cleaned_rows = []
    for row in rows:
        cleaned_row = {h: row.get(h, '') for h in REQUIRED_HEADERS}
        cleaned_rows.append(cleaned_row)

    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=REQUIRED_HEADERS, delimiter='\t')
        writer.writeheader()
        writer.writerows(cleaned_rows)

    print(f"Columns renamed and output written to {output_file}")

if __name__ == '__main__':
    main()
