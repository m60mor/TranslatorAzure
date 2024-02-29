import { useState, useEffect } from 'react'
import './App.css'
import TextTranslator from './components/TextTranslator/TextTranslator'
import DocumentTranslator from './components/DocumentTranslator/DocumentTranslator';

function App() {
  const [lang, setLang] = useState([]);
  const [selectedOption, setSelectedOption] = useState('text'); // Default to 'text' or 'document'

  const handleOptionChange = (event : any) => {
    setSelectedOption(event.target.value);
  };

  useEffect(() => {
    fetch('http://127.0.0.1:5000/get-languages')
      .then(response => response.json())
      .then(data => setLang(data))
      .catch(error => console.error('Error fetching languages:', error));
  }, []);

  const [inputLang, setInputLang] = useState("en");

  const handleInput = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setInputLang(event.target.value);
  }

  const [outputLang, setOutputLang] = useState("en");

  const handleOutput = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setOutputLang(event.target.value);
  }

  return (
    <>
      <select className='select-translator' value={selectedOption} onChange={handleOptionChange}>
      <option value="text">Text Translator</option>
      <option value="document">Document Translator</option>
      </select>
      
      <div className='main-container'>
        <select className="select-language" style={{ gridArea: "1 / 1", overflow: "hidden" }} value={inputLang} onChange={handleInput}>
          {Object.keys(lang).map((e : any) => (
            <option key={e} value={e}>
              {e + ' - ' + lang[e]}
              </option>
          ))}
        </select>
        <select className="select-language" style={{ gridArea: "1 / 3", overflow: "hidden" }} value={outputLang} onChange={handleOutput}>
          {Object.keys(lang).map((e : any) => (
            <option key={e} value={e}>
              {e + ' - ' + lang[e]}
            </option>
          ))}
        </select>

        {selectedOption === 'text' && (
          <TextTranslator inputLang={inputLang} outputLang={outputLang} />
        )}

        {selectedOption === 'document' && (
          <DocumentTranslator inputLang={inputLang} outputLang={outputLang} />
        )}
      </div>
    </>
  )
}

export default App
