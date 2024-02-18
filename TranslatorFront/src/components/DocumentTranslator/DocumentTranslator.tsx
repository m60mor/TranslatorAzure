import { useState } from "react";
import './DocumentTranslator.css'

export default function DocumentTranslator({ inputLang, outputLang } : any) {
    const [document, setDocument] = useState();

    const handleDocumentChange = (event : any) => {
      const file = event.target.files?.[0];
      setDocument(file);
    };

    const translateDocument = () => {
        if (document) {
            const formData = new FormData();
            formData.append('file', document);
            formData.append('json', JSON.stringify({inputLang, outputLang}))

            fetch('http://127.0.0.1:5000/translate-document', {
            method: 'POST',
            body: formData
            })
            .then(response => response.text())
            .then(data => console.log(data))
        }
    }
    
    return(
        <>
            <div className="document-container">
                <input type="file" onChange={handleDocumentChange} style={{ gridArea: "2 / 1" }}/>
                <button style={{ gridArea: "2 / 2" }} onClick={translateDocument}>Translate</button>
                <input type="file" style={{ gridArea: "2 / 3" }}/>
            </div>
        </>
    )
}