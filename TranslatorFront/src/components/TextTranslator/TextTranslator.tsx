import { useState } from "react";
import './TextTranslator.css'

export default function TextTranslator({ inputLang, outputLang }: any) {
    const [text, setText] = useState('');
    const [retText, setRetText] = useState('');

    const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
        let newText = e.currentTarget.innerHTML;
        newText = newText.replace(/<br>/gi, '').replace(/<p\s*[^>]*>/gi, '').replace(/<\/p\s*>/gi, '').replace(/<span\s*[^>]*>/gi, '').replace(/<\/span\s*>/gi, '');;
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
                setText(data.translated_text);
    
                const contentEditableDiv = document.querySelector('.text-field');
                if (contentEditableDiv) {
                    contentEditableDiv.innerHTML = data.translated_text;
                }
    
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
            <div className="text-field input" contentEditable onInput={handleTextChange}></div>
            <input type="file" onChange={handleFileChange} style={{ gridArea: "3 / 3 span", justifySelf: "start"}}/>
            <button onClick={translateText}>Translate</button>
            <div className="text-field output">{retText}</div>
        </>
    )
}
