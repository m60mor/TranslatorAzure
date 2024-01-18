import { useState } from "react";
import './TextTranslator.css'

export default function TextTranslator({ lang }: any) {
    const [text, setText] = useState('');
    const [retText, setRetText] = useState('');
    const [inputLang, setInputLang] = useState("en");

    const handleInput = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setInputLang(event.target.value);
    }

    const [outputLang, setOutputLang] = useState("en");

    const handleOutput = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setOutputLang(event.target.value);
    }

    const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
        const newText = e.currentTarget.innerHTML;
        console.log(newText);
        setText(newText);
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
    
            try {
                alert('Started file upload');
                const response = await fetch('http://127.0.0.1:5000/analyze-document', {
                    method: 'POST',
                    body: formData,
                });
    
                const data = await response.json();
    
                // Update the text field with the translated text
                console.log(data.translated_text);
                setText(data.translated_text);
    
                // Explicitly set the inner HTML of the contentEditable div
                const contentEditableDiv = document.querySelector('.text-field');
                if (contentEditableDiv) {
                    contentEditableDiv.innerHTML = data.translated_text;
                }
    
                // Notify the user that the file has been uploaded and processed
                alert('File uploaded and processed successfully!');
            } catch (error) {
                console.error('Error uploading or processing file:', error);
            }
        }
    };
    

    const translateText = () => {
        fetch('http://127.0.0.1:5000/set-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, inputLang, outputLang }),
        })
            .then(response => response.json())
            .then(data => {
                fetch('http://127.0.0.1:5000/translate-text')
                    .then(response => response.json())
                    .then(data => {
                        setRetText(data);
                    })
                    .catch(error => {
                        console.log(error);
                    })
            })
            .catch(error => {
                console.error('Error:', error);
            })
    }

    return (
        <>
            <div className="text-container">
                <select className="text-language" style={{ gridArea: "1 / 1" }} value={inputLang} onChange={handleInput}>
                    {Object.keys(lang).map((e) => (
                        <option key={e} value={e}>
                            {e + ' - ' + lang[e]}
                        </option>
                    ))}
                </select>
                <div className="text-field" style={{ gridArea: "2 / 1"}} contentEditable onInput={handleTextChange}></div>
                <input type="file" onChange={handleFileChange} style={{ gridArea: "3 / 1" }}/>
                <button onClick={translateText} style={{ gridArea: "2 / 2" }}>Translate</button>
                <select className="text-language" style={{ gridArea: "1 / 3" }} value={outputLang} onChange={handleOutput}>
                    {Object.keys(lang).map((e) => (
                        <option key={e} value={e}>
                            {e + ' - ' + lang[e]}
                        </option>
                    ))}
                </select>
                <div className="text-field" style={{ gridArea: "2 / 3" }}>{retText}</div>
            </div>
        </>
    )
}
