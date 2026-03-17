import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

export default function Home() {
  const [prompts, setPrompts] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("chatgpt");
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [preview, setPreview] = useState(null);

  const loadPrompts = async () => {
    const snapshot = await getDocs(collection(db, "prompts"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPrompts(data);
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const savePrompt = async () => {
    if (!file) return alert("Dodaj plik!");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");
      formData.append("resource_type", "auto");

      const res = await fetch("https://api.cloudinary.com/v1_1/ddrasgbno/auto/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data.secure_url) {
        alert("Błąd uploadu!");
        return;
      }

      await addDoc(collection(db, "prompts"), {
        image: data.secure_url,
        prompt,
        type,
        fileType: mediaType,
        createdAt: new Date()
      });

      setFile(null);
      setPreview(null);
      setPrompt("");
      loadPrompts();

    } catch (err) {
      console.error(err);
      alert("Coś poszło nie tak 😅");
    }
  };

  const editPrompt = async (id, newPrompt) => {
    const ref = doc(db, "prompts", id);
    await updateDoc(ref, { prompt: newPrompt });
    loadPrompts();
  };

  const copyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    alert("Skopiowano prompt 🔥");
  };

  return (
    <div style={{
      background: "#000",
      minHeight: "100vh"
    }}>
      
      <div style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        color: "white"
      }}>

        <h1 style={{fontSize:"32px", marginBottom:"20px"}}>🔥 Prompt Board</h1>

        {/* FORM */}
        <div style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "30px"
        }}>

          <select 
            value={mediaType} 
            onChange={(e)=>setMediaType(e.target.value)}
          >
            <option value="image">📸 Obraz</option>
            <option value="video">🎬 Video (Veo3)</option>
          </select>

          <p style={{fontSize:"12px", opacity:0.6}}>
            {mediaType === "video"
              ? "🎬 Video = automatycznie Veo3"
              : "📸 Dodaj obraz"}
          </p>

          <input 
            key={mediaType}
            type="file" 
            accept={mediaType === "video" ? "video/*" : "image/*"}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (!selected) return;

              setFile(selected);
              setPreview(URL.createObjectURL(selected));

              if (selected.type.startsWith("video")) {
                setMediaType("video");
                setType("veo3");
              } else {
                setMediaType("image");
              }
            }}
          />

          {preview && (
            <div style={{marginTop:"10px"}}>
              {mediaType === "video" ? (
                <video src={preview} controls style={{width:"100%"}} />
              ) : (
                <img src={preview} style={{width:"100%"}} />
              )}
            </div>
          )}

          <textarea 
            placeholder="Wpisz prompt..." 
            value={prompt} 
            onChange={e=>setPrompt(e.target.value)}
            style={{width:"100%", marginTop:"10px"}}
          />

          <select 
            value={type} 
            onChange={e=>setType(e.target.value)}
            disabled={mediaType === "video"}
          >
            <option value="chatgpt">🤖 ChatGPT</option>
            <option value="nanobanana">🍌 NanoBanana</option>
            <option value="veo3">🎬 Veo3</option>
          </select>

          <br/><br/>

          <button onClick={savePrompt}>💾 Zapisz</button>
        </div>

        {/* GRID */}
        <div style={{
          columnCount: 3,
          columnGap: "20px"
        }}>
          {prompts.map((item) => (
            <div key={item.id} style={{
              breakInside:"avoid",
              marginBottom:"20px",
              background:"#1a1a1a",
              borderRadius:"12px",
              padding:"10px",
              overflow:"visible"
            }}>
              
              {item.fileType === "video" ? (
                <video src={item.image} controls style={{width:"100%"}} />
              ) : (
                <img src={item.image} style={{width:"100%"}} />
              )}

              <Editable text={item.prompt} onSave={(t)=>editPrompt(item.id, t)} />

              <button 
                onClick={()=>copyPrompt(item.prompt)}
                style={{
                  marginTop:"5px",
                  background:"#333",
                  border:"none",
                  padding:"5px 10px",
                  borderRadius:"6px",
                  color:"white",
                  cursor:"pointer"
                }}
              >
                📋 Kopiuj prompt
              </button>

              <p style={{fontSize:"12px", opacity:0.6}}>
                {item.type === "chatgpt" && "🤖 ChatGPT"}
                {item.type === "nanobanana" && "🍌 NanoBanana"}
                {item.type === "veo3" && "🎬 Veo3"}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function Editable({text, onSave}) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(text);
  const [expanded, setExpanded] = useState(false);

  if (edit) {
    return (
      <div>
        <textarea value={val} onChange={e=>setVal(e.target.value)} />
        <button onClick={()=>{onSave(val); setEdit(false)}}>💾</button>
      </div>
    );
  }

  return (
    <div>
      <p style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        lineHeight: "1.5"
      }}>
        {expanded ? text : text.slice(0,120)}
        {!expanded && text.length > 120 && "..."}
      </p>

      <div style={{display:"flex", gap:"10px"}}>
        {text.length > 120 && (
          <button onClick={()=>setExpanded(!expanded)}>
            {expanded ? "▲ zwiń" : "▼ czytaj więcej"}
          </button>
        )}

        <button onClick={()=>setEdit(true)}>✏️ edytuj</button>
      </div>
    </div>
  );
}
