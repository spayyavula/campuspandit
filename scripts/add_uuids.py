import sys
import csv
import uuid

REQUIRED_HEADERS = [
    'id','title','content','questionType','difficulty','subject','board','grade',
    'topicTags','marks','timeLimit','isPublished','createdAt','updatedAt'
]

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except Exception:
        return False

def main():
    if len(sys.argv) != 3:
        print("Usage: python add_uuids.py <input_file.tsv> <output_file.tsv>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile, delimiter='\t')
        rows = list(reader)

    for row in rows:
        if not is_valid_uuid(row.get('id', '')):
            row['id'] = str(uuid.uuid4())

    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=REQUIRED_HEADERS, delimiter='\t')
        writer.writeheader()
        for row in rows:
            # Only write required headers
            writer.writerow({h: row.get(h, '') for h in REQUIRED_HEADERS})

    print(f"UUIDs generated for id column. Output written to {output_file}")

if __name__ == '__main__':
    main()
