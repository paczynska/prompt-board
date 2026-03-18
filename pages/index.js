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
        prompt: prompt || "",
        type,
        fileType: file.type.startsWith("video") ? "video" : "image",
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

  return (
   <div style={{ 
  background: "#000", 
  minHeight: "100vh",
  fontFamily: "inherit"
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

          <select value={mediaType} onChange={(e)=>setMediaType(e.target.value)}>
            <option value="image">📸 Obraz</option>
            <option value="video">🎬 Video (Veo3)</option>
          </select>

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
                <video src={preview} controls style={{width:"100%", maxHeight:"300px"}} />
              ) : (
                <img src={preview} style={{width:"100%", maxHeight:"300px", objectFit:"cover"}} />
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
              padding:"10px"
            }}>
              
              {item.fileType === "video" ? (
                <video src={item.image} controls style={{width:"100%", maxHeight:"300px"}} />
              ) : (
                <img src={item.image} style={{width:"100%", maxHeight:"300px", objectFit:"cover"}} />
              )}

              <Editable text={item.prompt || ""} onSave={(t)=>editPrompt(item.id, t)} />

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

/* 🔥 NOWOCZESNE BUTTONY */
const btnStyle = {
  background: "#222",
  border: "1px solid #333",
  color: "white",
  padding: "6px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "0.2s",
};

function Editable({text = "", onSave}) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(text);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLong = text.length > 120;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (edit) {
    return (
      <div>
        <textarea 
          value={val} 
          onChange={e=>setVal(e.target.value)}
          style={{width:"100%", minHeight:"80px"}}
        />
        <button onClick={()=>{onSave(val); setEdit(false)}}>💾</button>
      </div>
    );
  }

  return (
    <div>
      <p style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: "1.6"
      }}>
        {expanded || !isLong ? text : text.substring(0,120) + "..."}
      </p>

      <div style={{display:"flex", gap:"10px", marginTop:"8px"}}>

        {isLong && (
          <button onClick={()=>setExpanded(!expanded)} style={btnStyle}>
            {expanded ? "▲ Zwiń" : "▼ Czytaj więcej"}
          </button>
        )}

        <button onClick={()=>setEdit(true)} style={btnStyle}>
          ✏️ Edytuj
        </button>

        <button 
          onClick={handleCopy}
          style={{
            ...btnStyle,
            background: copied ? "#00c853" : "#222"
          }}
        >
          {copied ? "✔ Skopiowano" : "📋 Kopiuj"}
        </button>

      </div>
    </div>
  );
}
