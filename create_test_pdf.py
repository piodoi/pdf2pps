from fpdf import FPDF

def create_test_pdf():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font('Arial', size=12)
    
    test_content = """This is a test PDF document for testing the PDF to presentation converter. 
It contains important information about AI technology.
Key points:
1. AI systems are becoming more advanced
2. Machine learning models require training data
3. Natural language processing has improved significantly
4. Computer vision can identify objects in images
5. Ethical considerations are important in AI development"""
    
    pdf.multi_cell(0, 10, test_content)
    pdf.output('test_files/test.pdf')
    
    print("Created test PDF file")

if __name__ == "__main__":
    import os
    os.makedirs('test_files', exist_ok=True)
    create_test_pdf()
