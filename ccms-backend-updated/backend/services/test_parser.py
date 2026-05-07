import sys
sys.path.append(".")

from backend.services.pdf_parser import parse_pdf

result = parse_pdf("Brindavan_Hydropower_vs_UoI.pdf")

print("=== PARSER OUTPUT ===")
print(f"Method Used: {result.method_used}")
print(f"Page Count: {result.page_count}")
print(f"Word Count: {result.word_count}")
print(f"\nFirst 500 chars of text:\n{result.text[:500]}")
print(f"\nBBoxes Found: {len(result.bboxes)}")
for bbox in result.bboxes[:3]:
    print(bbox)