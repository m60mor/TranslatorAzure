import os
import requests
import json
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

key = "599471b6ead24ab2914dd26f79c318ae"
endpoint = "https://api.cognitive.microsofttranslator.com"
location = "westeurope"

endpoint2 = "https://amdocint.cognitiveservices.azure.com/"
key2 = "003509088f534a798adc04cecc767e65"

input_code = "pl"
output_code = "en"
text = ""
translated_text = ""

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def translate_text_azure():
    global translated_text
    global input_code
    global output_code

    try:
        route = f"/translate?api-version=3.0&from={input_code}&to={output_code}"

        headers = {
            "Ocp-Apim-Subscription-Key": key,
            "Ocp-Apim-Subscription-Region": location,
            "Content-Type": "application/json",
        }

        body = [{"Text": text}]
        request_body = json.dumps(body)
        url = endpoint + route
        response = requests.post(url, headers=headers, data=request_body)

        if response.status_code == 200:
            data = json.loads(response.text)
            translations = data[0]['translations']
            translated_text = [item['text'] for item in translations][0]
        else:
            print("Error:", response.status_code, response.text)

    except KeyboardInterrupt:
        print("\nProgram stopped by the user.")

@app.route('/upload-file', methods=['POST'])
def upload_file():
    try:
        file = request.files['file']

        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return jsonify({'message': 'File uploaded successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/analyze-document', methods=['POST'])
def analyze_document():
    try:
        file = request.files['file']

        if file:
            filename = file.filename
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            document_analysis_client = DocumentAnalysisClient(
                endpoint=endpoint2, credential=AzureKeyCredential(key2)
            )

            with open(file_path, "rb") as form_file:
                poller = document_analysis_client.begin_analyze_document(
                    "prebuilt-read", document=form_file
                )

            result = poller.result()
            translated_text = result.content
            delete_file(file_path)
            return jsonify({'filename': filename, 'translated_text': translated_text}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400

def extract_text_from_result(result):
    try:
        return " ".join([line.content for page in result.pages for line in page.lines])
    except Exception as e:
        return str(e)

def delete_file(file_path):
    try:
        os.remove(file_path)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route("/get-languages")
def get_languages():
    l_library = {}
    url = f"{endpoint}/languages?api-version=3.0"

    headers = {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": location,
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        if response:
            data = json.loads(response.text)

            for scope in data.values():
                for lang_code, lang_info in scope.items():
                    language_name = lang_info.get('name')
                    if language_name:
                        l_library[lang_code] = language_name
        return jsonify(l_library)
    else:
        return jsonify({response.text}), response.status_code

@app.route('/translate-text')
def get_text():
    translate_text_azure()
    return jsonify(translated_text)

@app.route('/set-text', methods=['POST'])
def set_text():
    global text
    global input_code
    global output_code

    try:
        data = request.get_json()
        text = data['text']
        input_code = data['inputLang']
        output_code = data['outputLang']
        return jsonify({'message': 'Data updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)
