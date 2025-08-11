import sys
import csv

# Map of camelCase to snake_case for all relevant columns
CAMEL_TO_SNAKE = {
    'isPublished': 'is_published',
    'questionType': 'question_type',
    'timeLimit': 'time_limit',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
}

def main():
    if len(sys.argv) != 3:
        print("Usage: python camel_to_snake_tsv.py input.tsv output.tsv")
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
    # Convert all camelCase columns to snake_case if present
    new_header = [CAMEL_TO_SNAKE.get(h, h) for h in header]

    with open(output_file, 'w', encoding='utf-8', newline='') as fout:
        writer = csv.writer(fout, delimiter='\t')
        writer.writerow(new_header)
        for row in rows[1:]:
            writer.writerow(row)

    print(f"Converted camelCase columns to snake_case in {output_file}")

if __name__ == "__main__":
    main()
