from flask import Flask, jsonify, request
from flask_cors import CORS

import requests
import json

key = "599471b6ead24ab2914dd26f79c318ae"
endpoint = "https://api.cognitive.microsofttranslator.com"
location = "westeurope"

input_code = "pl"
output_code = "en"
text = ""
translated_text = ""
app = Flask(__name__)
CORS(app)

def translateTextAzure():
    global translated_text
    global input_code
    global output_code
    try:
        route = "/translate?api-version=3.0&from"

        route = route + "=" + input_code + "&to=" + output_code

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

@app.route("/")
def hello_world():
    return "Hello, World!"

@app.route("/get-languages")
def get_languages():
    l_library = {}
    url = endpoint + "/languages?api-version=3.0"

    headers = {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": location,
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        if response:
            data = json.loads(response.text)  # Parse the JSON string

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
    translateTextAzure()
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
