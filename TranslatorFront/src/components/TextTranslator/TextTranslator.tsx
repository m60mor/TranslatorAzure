import { useState } from "react";
import './TextTranslator.css'

export default function TextTranslator({lang} : any) {
    const [text, setText] = useState('')
    const [retText, setRetText] = useState('');

    const [inputLang, setInputLang] = useState("en");

    const handleInput = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setInputLang(event.target.value);
    }

    const [outputLang, setOutputLang] = useState("en");

    const handleOutput = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setOutputLang(event.target.value);
    }

    const translateText = () => {
      fetch('http://127.0.0.1:5000/set-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({text, inputLang, outputLang}),
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
            <select className="text-language" style={{gridArea: "1 / 1"}} value={inputLang} onChange={handleInput}>
                {Object.keys(lang).map((e) => (
                    <option key={e} value={e}>
                        {e +  ' - ' + lang[e]}
                    </option>
                ))}
            </select>
            <div className="text-field" style={{gridArea: "2 / 1"}} contentEditable onInput={(e) => setText(e.target.innerText)}></div>
            <button onClick={translateText} style={{gridArea: "2 / 2"}}>Translate</button>
            <select className="text-language" style={{gridArea: "1 / 3"}} value={outputLang} onChange={handleOutput}>
                {Object.keys(lang).map((e) => (
                    <option key={e} value={e}>
                        {e +  ' - ' + lang[e]}
                    </option>
                ))}
            </select>
            <div className="text-field" style={{gridArea: "2 / 3"}}>{retText}</div>
        </div>
      </>
    )
}