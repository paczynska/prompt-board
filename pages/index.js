import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

export default function Home() {
  const [prompts, setPrompts] = useState([]);
  const [image, setImage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("chatgpt");

  const loadPrompts = async () => {
    const snapshot = await getDocs(collection(db, "prompts"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPrompts(data);
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const savePrompt = async () => {
    await addDoc(collection(db, "prompts"), {
      image,
      prompt,
      type,
      createdAt: new Date()
    });
    setImage("");
    setPrompt("");
    loadPrompts();
  };

  const editPrompt = async (id, newPrompt) => {
    const ref = doc(db, "prompts", id);
    await updateDoc(ref, { prompt: newPrompt });
    loadPrompts();
  };

  return (
    <div style={{padding:20, background:"black", minHeight:"100vh", color:"white"}}>
      <h1>🔥 Prompt Board</h1>

      <input placeholder="Image URL" value={image} onChange={e=>setImage(e.target.value)} />
      <br/><br/>

      <textarea placeholder="Prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} />
      <br/><br/>

      <select value={type} onChange={e=>setType(e.target.value)}>
        <option value="chatgpt">ChatGPT Image</option>
        <option value="nanobanana">NanoBanana</option>
      </select>

      <br/><br/>
      <button onClick={savePrompt}>Zapisz</button>

      <div>
        {prompts.map(item => (
          <div key={item.id} style={{marginTop:20}}>
            <img src={item.image} width="200" />
            <Editable text={item.prompt} onSave={(t)=>editPrompt(item.id, t)} />
            <p>{item.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Editable({text, onSave}) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(text);

  return edit ? (
    <div>
      <textarea value={val} onChange={e=>setVal(e.target.value)} />
      <button onClick={()=>{onSave(val); setEdit(false)}}>💾</button>
    </div>
  ) : (
    <p onClick={()=>setEdit(true)}>{text}</p>
  );
}
