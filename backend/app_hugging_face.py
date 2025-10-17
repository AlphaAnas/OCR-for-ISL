# ensure OLLAMA is running , if not use command OLLAMA SERVE in another terminal to start it


'''
USING LLAMA3.2
'''
from flask import Flask, request, jsonify
import os
import easyocr
from PIL import Image
from huggingface_hub import login
from transformers import pipeline
import numpy as np



app = Flask(__name__)

# Initialize the OCR reader
reader = easyocr.Reader(['en'])  # 'en' for English




# --- Hugging Face Authentication ---
token = os.environ.get("HUGGINGFACEHUB_TOKEN")
if not token:
    raise ValueError("❌ No Hugging Face token found in environment variable 'HUGGINGFACEHUB_TOKEN'.")
login(token=token)
print("✅ Successfully logged in to Hugging Face with provided token.")


# Load the Llama 3.2 model
pipe = pipeline("text-generation", model="meta-llama/Llama-3.2-3B")



# Define prompt template to extract key invoice fields in JSON
template = """You are an expert invoice parser.
We are providing you text extracted from an invoice. The invoice usually has a structure where the top part defines Vendor Information. The next part defines information about the invoice, and then a table containing items in the invoice with quantity and price.

Task: From the invoice text provided below, extract the key fields:
- Either Invoice Number or Bill Number: Integer (Output field: InvoiceNumber)
- Items (grouped in a list with ItemName (string), Price (decimal), Quantity (integer), and Total(decimal)) (Output field: Items)
- Customer Name: String (Output field: CustomerName)
- Invoice Date: Date (Output field: InvoiceDate)
- Vendor Name: String (Output field: VendorName)
- Vendor Tax ID: String (Output field: VendorTaxID)
- Payment Method: String (Output field: PaymentMethod)
- Withholding Tax Amount: Decimal ((Output field: WitholdingTaxAmount))
- GST Amount: Decimal (Output field: GSTAmount)
- Purchase Order(PO) Number: Integer (Output field: PONumber)
- Invoice Type: String (Output field: InvoiceType)
- Total Amount: Decimal (Output field: TotalAmount)
- Tax Invoice Number (Output field: TaxInvoiceNumber)


Provide the output as a JSON object with the exact field names specified above. If a field is missing, ignore it and do not fill it in or make assumptions.

Restrictions:
Only provide the JSON object with the exact field names.
Do not provide any other text or explanations.
If you are unable to find any fields, provide an empty JSON object.
All rows of items must be grouped together.

Invoice Text:
{invoice_text}

Answer (in JSON):
"""


def process_image(image_file):
    """Process a single image and return the extracted data."""
    try:
        # Open the image from bytes and convert to a format EasyOCR can use
        pil_image = Image.open(image_file)

        # Extract text using EasyOCR
        extracted_text = reader.readtext(pil_image, detail=0) # detail=0 to get only text
        invoice_text = " ".join(extracted_text)
        prompt = template.format(invoice_text=invoice_text)

        
        # Combine the prompt with the model and invoke the chain
        response = pipe(prompt)
        result = response[0]["generated_text"]

        return result
    except Exception as e:
        return {"error": str(e)}

@app.route('/api/parse-invoice', methods=['POST'])
def parse_invoice():
    """API endpoint to parse invoice images."""
    # Check if an image file is part of the request
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    image_file = request.files['image']
    
    # Check if the file has a valid extension
    valid_extensions = {'.jpg', '.jpeg', '.png', '.tiff', '.bmp'}
    if not any(image_file.filename.lower().endswith(ext) for ext in valid_extensions):
        return jsonify({"error": "Unsupported file format"}), 400
    
    # Process the image
    result = process_image(image_file)
    print(result)
    
    # Return the result
    return jsonify({
        "result": result
    }), 200

@app.route('/', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({"status": "API is running", "version": "1.0"}), 200

if __name__ == "__main__":
    # Ensure output folder exists (optional, if you want to keep saving locally)
    output_folder = "./extracted_invoices-output"
    os.makedirs(output_folder, exist_ok=True)
    
    # Run the Flask app
    app.run(debug = False, host='0.0.0.0', port=5000)


