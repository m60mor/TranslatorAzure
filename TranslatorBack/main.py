import os
import requests
import json
import time
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.identity import DefaultAzureCredential
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename

# paste your azure credentials here
key = ""
endpoint = ""
location = ""

endpoint2 = ""
key2 = ""

endpointDoc = ""
sourceSASUrl = ""
targetSASUrl = ""

input_code = "pl"
output_code = "en"
text = ""
translated_text = ""

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def poll_translation_status(operation_location, headers):
    try:
        for i in range(10):
            response = requests.get(operation_location, headers=headers)
            response.raise_for_status()  # Raise an HTTPError for bad responses

            result = response.json()
            status = result.get('status')

            if status == 'Succeeded':
                return result
            elif status == 'ValidationFailed':
                raise Exception(f"Translation failed. Error: {result.get('error')}")

            print(status)
            time.sleep(5)
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error during translation status polling: {str(e)}")

def download_blob_to_bytes(blob_service_client, container_name, blob_name):
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
    downloader = blob_client.download_blob(max_concurrency=1)
    blob_data = downloader.readall()
    blob_client.delete_blob()
    blob_service_client.close()
    return blob_data
@app.route('/translate-document', methods=['POST'])
def translate_document_azure():
    global endpointDoc
    global key
    global input_code
    global output_code
    global sourceSASUrl
    global targetSASUrl

    json_data = request.form['json']
    json_data = json.loads(json_data)
    input_code = json_data['inputLang']
    output_code = json_data['outputLang']
    file = request.files["file"]
    filename = ""
    blob_client = ""

    account_url = "https://document60.blob.core.windows.net"
    default_credential = DefaultAzureCredential()

    blob_service_client = BlobServiceClient(account_url, credential=default_credential)

    if file:
        filename = file.filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        blob_client = blob_service_client.get_blob_client(container="input", blob=filename)
        with open(file="./uploads/" + filename, mode="rb") as data:
            blob_client.upload_blob(data)
        os.remove(file_path)

    try:
        path = 'translator/text/batch/v1.1/batches'
        constructed_url = endpointDoc + path

        body = {
            "inputs": [
                {
                    "source": {
                        "sourceUrl": sourceSASUrl,
                        "storageSource": "AzureBlob",
                        "language": input_code
                    },
                    "targets": [
                        {
                            "targetUrl": targetSASUrl,
                            "storageSource": "AzureBlob",
                            "category": "general",
                            "language": output_code
                        }
                    ]
                }
            ]
        }
        headers = {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/json',
        }

        response = requests.post(constructed_url, headers=headers, json=body)
        response_headers = response.headers

        print(f'response status code: {response.status_code}\nresponse status: {response.reason}\n\nresponse headers:\n')

        for i, value in response_headers.items():
            print(i, ":", value)
        print(response)

        if response.status_code == 202:
            operation_location = response_headers.get('Operation-Location')
            print(operation_location)
            if operation_location:
                translation_result = poll_translation_status(operation_location, headers)
                blob_client.delete_blob()
                print("Translation result:", translation_result)
                stream = download_blob_to_bytes(blob_service_client, "output", filename)
                return Response(stream)
            else:
                print("Operation-Location header not found in the response.")
                return jsonify({'b': str(5)})
        else:
            print("Unexpected response code:", response.status_code)
            return jsonify({'error': str(response.status_code)})

    except Exception as e:
        print(f"Error during translation: {str(e)}")
        return jsonify({'error': str(e)})


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
