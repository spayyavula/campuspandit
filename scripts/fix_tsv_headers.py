import csv
import sys

# Usage: python fix_tsv_headers.py input.tsv output.tsv
# This script will:
# - Rename headers to match the import UI
# - Add missing columns (analytics)
# - Reorder columns as needed
# - Fill missing analytics with '{}'

EXPECTED_HEADERS = [
    'id', 'title', 'content', 'questionType', 'difficulty', 'subject', 'board', 'grade',
    'topicTags', 'marks', 'timeLimit', 'isPublished', 'createdAt', 'updatedAt', 'analytics'
]

# Mapping from old to new header names
HEADER_MAP = {
    'question_type': 'questionType',
    'topic_tags': 'topicTags',
    'time_limit': 'timeLimit',
    'is_published': 'isPublished',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    # 'analytics' may not exist, will be added
}

def fix_headers(input_path, output_path):
    with open(input_path, encoding='utf-8') as infile:
        reader = csv.DictReader(infile, delimiter='\t')
        # Map headers
        fieldnames = reader.fieldnames
        if not fieldnames:
            print('No headers found!')
            sys.exit(1)
        # Build new header list
        new_fieldnames = []
        for h in fieldnames:
            new_fieldnames.append(HEADER_MAP.get(h, h))
        # Ensure all expected headers are present
        for h in EXPECTED_HEADERS:
            if h not in new_fieldnames:
                new_fieldnames.append(h)
        # Write output
        with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=EXPECTED_HEADERS, delimiter='\t')
            writer.writeheader()
            for row in reader:
                new_row = {}
                for old, new in HEADER_MAP.items():
                    if old in row:
                        row[new] = row.pop(old)
                for h in EXPECTED_HEADERS:
                    if h in row and row[h] is not None:
                        new_row[h] = row[h]
                    elif h == 'analytics':
                        new_row[h] = '{}'
                    else:
                        new_row[h] = ''
                writer.writerow(new_row)
    print(f'Fixed headers and saved to {output_path}')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python fix_tsv_headers.py input.tsv output.tsv')
        sys.exit(1)
    fix_headers(sys.argv[1], sys.argv[2])
