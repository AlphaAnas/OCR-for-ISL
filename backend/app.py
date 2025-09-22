# ensure OLLAMA is running , if not use command OLLAMA SERVE in another terminal to start it


'''
USING LLAMA3.2
'''
from flask import Flask, request, jsonify
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import OllamaLLM
import easyocr
from PIL import Image
import io

app = Flask(__name__)

# Initialize the OCR reader
reader = easyocr.Reader(['en'])  # 'en' for English

# Load the Llama 3.2 model
model_3b = OllamaLLM(model="llama3.2:3b")

from transformers import pipeline
import torch


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
prompt = ChatPromptTemplate.from_template(template)

def process_image(image_file):
    """Process a single image and return the extracted data."""
    try:
        # Open the image from bytes and convert to a format EasyOCR can use
        pil_image = Image.open(image_file)
        
        # Extract text using EasyOCR
        extracted_text = reader.readtext(pil_image, detail=0)
        invoice_text = " ".join(extracted_text)
        
        # Combine the prompt with the model and invoke the chain
        chain = prompt | model_3b
        # chain = prompt | model_llama_minitron
        response = chain.invoke({"invoice_text": invoice_text})
        
        return response
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









'''
USING GEMINI 2.0 BELOW
'''
# from flask import Flask, request, jsonify
# import os
# import google.generativeai as genai
# from PIL import Image
# import io

# app = Flask(__name__)

# # Configure the API with your key
# genai.configure(api_key="AIzaSyB9k6XTcl1AfaG4lYqKTcytaOZb3_gIiW8")  # Replace with your actual API key

# # Initialize the Gemini 2.0 Flash model
# model = genai.GenerativeModel("gemini-2.0-flash")

# # Define prompt template
# prompt = """You are an expert invoice parser.
# From the invoice image provided, extract the key fields:
# - Invoice Number
# - Items with their price, quantity, and total
# - Customer Name
# - Invoice Date
# - Vendor Name
# - Vendor Tax ID
# - Payment Method
# - Payment Withholding Tax Group
# - PO Number
# - Invoice Type
# - Total Amount
# Provide your answer in valid JSON format with keys exactly as mentioned.

# Answer (in JSON):
# """

# def process_image(image_file):
#     """Process a single image and return the extracted data."""
#     try:
#         # Open the image from bytes
#         pil_image = Image.open(image_file)
        
#         # Generate content using Gemini 2.0 Flash
#         response = model.generate_content(
#             contents=[prompt, pil_image]
#         )
        
#         return response.text
#     except Exception as e:
#         return {"error": str(e)}

# @app.route('/api/parse-invoice', methods=['POST'])
# def parse_invoice():
#     """API endpoint to parse invoice images."""
#     # Check if an image file is part of the request
#     if 'image' not in request.files:
#         return jsonify({"error": "No image file provided"}), 400
    
#     image_file = request.files['image']
    
#     # Check if the file has a valid extension
#     valid_extensions = {'.jpg', '.jpeg', '.png', '.tiff', '.bmp'}
#     if not any(image_file.filename.lower().endswith(ext) for ext in valid_extensions):
#         return jsonify({"error": "Unsupported file format"}), 400
    
#     # Process the image
#     result = process_image(image_file)
    
#     # Return the result
#     return jsonify({
#         "status": "success",
#         "result": result
#     })

# @app.route('/', methods=['GET'])
# def health_check():
#     """Simple health check endpoint."""
#     return jsonify({"status": "API is running", "version": "1.0"})

# if __name__ == '__main__':
#     # Run the Flask app
#     app.run(debug=True)