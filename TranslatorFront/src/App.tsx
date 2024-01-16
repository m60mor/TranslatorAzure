import { useState, useEffect } from 'react'
import './App.css'
import TextTranslator from './components/TextTranslator/TextTranslator'

function App() {
  const [lang, setLang] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/get-languages')
      .then(response => response.json())
      .then(data => setLang(data))
      .catch(error => console.error('Error fetching languages:', error));
  }, []);

  return (
    <>
      {/* {Object.keys(lang).map((e : any) => <div>{e}</div>)} */}
      <TextTranslator lang={lang}/>
    </>
  )
}

export default App
