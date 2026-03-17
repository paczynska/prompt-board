import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

export default function Home() {
  const [prompts, setPrompts] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("chatgpt");
  const [file, setFile] = useState(null);

  const loadPrompts = async () => {
    const snapshot = await getDocs(collection(db, "prompts"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPrompts(data);
  };

  useEffect(() => {
    loadPrompts();
  }, []);

const savePrompt = async () => {
  if (!file) return alert("Dodaj zdjęcie!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default");

  const res = await fetch("https://api.cloudinary.com/v1_1/ddrasgbno/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  const imageUrl = data.secure_url;

  await addDoc(collection(db, "prompts"), {
    image: imageUrl,
    prompt,
    type,
    createdAt: new Date()
  });

  setFile(null);
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

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
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
  {prompts.map((item) => {
    return (
      <div 
  key={item.id} 
  style={{
    marginTop: 20,
    borderRadius: "16px",
    overflow: "hidden",
    background: "#1a1a1a",
    boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
    transition: "all 0.3s ease",
    cursor: "pointer"
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "scale(1.03)";
    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.8)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.6)";
  }}
>
        <img 
  src={item.image} 
  alt="img"
  style={{
    width: "100%",
    transition: "transform 0.4s ease"
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "scale(1.1)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "scale(1)";
  }}
/>
        <Editable text={item.prompt} onSave={(t) => editPrompt(item.id, t)} />
        <p>{item.type}</p>
      </div>
    );
  })}
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
