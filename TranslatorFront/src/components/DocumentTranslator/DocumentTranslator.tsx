import { useState } from "react";
import './DocumentTranslator.css'

export default function DocumentTranslator({ inputLang, outputLang } : any) {
    const [document, setDocument] = useState<File | null>(null);
    const [docLink, setDocLink] = useState<string>('');

    const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setDocument(file);
            setDocLink('');
        }
    };

    const translateDocument = () => {
        if (document) {
            const formData = new FormData();
            formData.append('file', document);
            formData.append('json', JSON.stringify({ inputLang, outputLang }));

            fetch('http://127.0.0.1:5000/translate-document', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.arrayBuffer())
            .then(data => {
                const blob = new Blob([data], { type: 'application/octet-stream' });
                const link = URL.createObjectURL(blob);
                setDocLink(link);
            })
            .catch(error => {
                console.error('Error translating document:', error);
            });
        }
    };
    
    return(
        <>
            <label htmlFor="file-upload" className="custom-file-upload" style={{ gridArea: "2 / 1" }}>
                Select file
            </label>
            <input id="file-upload" type="file" onChange={handleDocumentChange} style={{ gridArea: "2 / 1" }}/>
            <button style={{ gridArea: "2 / 2" }} onClick={translateDocument}>Translate</button>
            {docLink === '' ? 
                <h2 style={{ gridArea: "2 / 3" }}>Here will be your file</h2> :
                <a href={docLink} download={document?.name} style={{ gridArea: "2 / 3" }}>Download {document?.name}</a>
            }
        </>
    )
}