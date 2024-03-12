import { useState, useEffect } from 'react'
import './App.css'
import TextTranslator from './components/TextTranslator/TextTranslator'
import DocumentTranslator from './components/DocumentTranslator/DocumentTranslator';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState([]);
  const [inputLang, setInputLang] = useState("en");
  const [outputLang, setOutputLang] = useState("en");
  const [selectedOption, setSelectedOption] = useState("Text Translator");
  const [isHover, setIsHover] = useState(false);

  const toggleTheme = () => {
    isDark ? setIsDark(false) : setIsDark(true);
  }

  const handleInput = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setInputLang(event.target.value);
  }

  const handleOutput = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setOutputLang(event.target.value);
  }

  // const handleOptionChange = (event : any) => {
  //   setSelectedOption(event.target.value);
  // }

  const mobileHover = () => {
      setIsHover(!isHover);
    }

  useEffect(() => {
    fetch('http://127.0.0.1:5000/get-languages')
      .then(response => response.json())
      .then(data => setLang(data))
      .catch(error => console.error('Error fetching languages:', error));

    if (isDark) {
      document.body.style.background = "#242424"
      document.body.style.colorScheme = "light dark"
    }
    else {
      document.body.style.background = "#fff" 
      document.body.style.colorScheme = ""
    }
  }, [isDark]);

  return (
    <>
    <div className='header'>
      <div className='header__logo'>
        Translator
      </div>
      <div className='header__filler'></div>
      <ul className={`select-translator ${isHover ? "select-translator--touch" : ""}`} onClick={mobileHover}>
        <div className='select-translator__selected'>{selectedOption}</div>
        <div className='select-translator__arrow'>&#x25BC;</div>
        <li className={`${isHover ? 'select-translator__li select-translator__li--touch' : 'select-translator__li'}`} onClick={() => setSelectedOption("Text Translator")}>Text Translator</li>
        <li className={`${isHover ? 'select-translator__li select-translator__li--touch' : 'select-translator__li'}`} onClick={() => setSelectedOption("Document Translator")}>Document Translator</li>
      </ul>
      <div className='header__theme-toggle' onClick={toggleTheme}></div>
    </div>
      
      <div className='main-container'>
        <div className='select-container' style={{ gridArea: "1 / 1"}}>
          <select className={isDark ? "select-language select-language--dark" : "select-language"} value={inputLang} onChange={handleInput}>
            {Object.keys(lang).map((e : any) => (
              <option className='select-language__option' key={e} value={e}>
                {e + ' - ' + lang[e]}
                </option>
            ))}
          </select>
        </div>
        <div className='select-container' style={{ gridArea: "1 / 3"}}>
          <select className={isDark ? "select-language select-language--dark" : "select-language"} value={outputLang} onChange={handleOutput}>
            {Object.keys(lang).map((e : any) => (
              <option className='select-language__option' key={e} value={e}>
                {e + ' - ' + lang[e]}
              </option>
            ))}
          </select>
        </div>

        {selectedOption === 'Text Translator' && (
          <TextTranslator inputLang={inputLang} outputLang={outputLang} isDark={isDark}/>
        )}

        {selectedOption === 'Document Translator' && (
          <DocumentTranslator inputLang={inputLang} outputLang={outputLang} isDark={isDark} />
        )}
      </div>
    </>
  )
}

export default App
