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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");
    formData.append("resource_type", "auto");

    const res = await fetch("https://api.cloudinary.com/v1_1/ddrasgbno/auto/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

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
  };

  const editPrompt = async (id, newPrompt) => {
    const ref = doc(db, "prompts", id);
    await updateDoc(ref, { prompt: newPrompt });
    loadPrompts();
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily:"inherit" }}>
      
      <div style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        color: "white"
      }}>

        <h1 style={{fontSize:"32px", marginBottom:"20px"}}>🔥 PLANETA PROMPTÓW</h1>

        {/* 🔥 NOWOCZESNY FORM */}
        <div style={{
          background: "linear-gradient(145deg, #1a1a1a, #111)",
          padding: "25px",
          borderRadius: "20px",
          marginBottom: "30px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          border: "1px solid #2a2a2a"
        }}>

          <select value={mediaType} onChange={(e)=>setMediaType(e.target.value)} style={inputStyle}>
            <option value="image">📸 OBRAZ</option>
            <option value="video">🎬 VIDEO</option>
          </select>

          <div style={{marginTop:"12px"}}>
            <label style={uploadBox}>
              📁 Wybierz plik
              <input 
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
                style={{display:"none"}}
              />
            </label>
          </div>

          {preview && (
            <div style={{marginTop:"15px"}}>
              {mediaType === "video" ? (
                <video src={preview} controls style={previewStyle} />
              ) : (
                <img src={preview} style={previewStyle} />
              )}
            </div>
          )}

          <textarea 
            placeholder="✨ Wpisz prompt..." 
            value={prompt} 
            onChange={e=>setPrompt(e.target.value)}
            style={textareaStyle}
          />

         <select 
  value={type} 
  onChange={e=>setType(e.target.value)}
  style={inputStyle}
>
  <select 
  value={type} 
  onChange={e=>setType(e.target.value)}
  style={inputStyle}
>
  {mediaType === "video" ? (
    <option value="veo3">🎬 Veo3</option>
  ) : (
    <>
      <option value="chatgpt">🤖 ChatGPT</option>
      <option value="nanobanana">🍌 NanoBanana</option>
      <option value="grok">🧠 Grok</option>
    </>
  )}
</select>

          <button onClick={savePrompt} style={buttonStyle}>
            🚀 Dodaj prompt
          </button>

        </div>

        {/* GRID */}
        <div style={{ columnCount: 3, columnGap: "20px" }}>
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
{item.type === "grok" && "🧠 Grok"}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* 🔥 STYLE */
const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #333",
  background: "#111",
  color: "white",
  marginTop: "10px"
};

const textareaStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #333",
  background: "#111",
  color: "white",
  marginTop: "15px",
  minHeight: "100px"
};

const buttonStyle = {
  width: "100%",
  marginTop: "15px",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg,#ff0080,#7928ca)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "16px"
};

const uploadBox = {
  display: "block",
  padding: "14px",
  borderRadius: "12px",
  border: "1px dashed #444",
  textAlign: "center",
  cursor: "pointer",
  background: "#111",
  color: "#aaa"
};

const previewStyle = {
  width: "100%",
  borderRadius: "12px",
  maxHeight: "300px",
  objectFit: "cover"
};

const btnStyle = {
  background: "#222",
  border: "1px solid #333",
  color: "white",
  padding: "6px 12px",
  borderRadius: "10px",
  cursor: "pointer"
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
        <textarea value={val} onChange={e=>setVal(e.target.value)} style={{width:"100%"}} />
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
        <button onClick={()=>setEdit(true)} style={btnStyle}>✏️ Edytuj</button>
        <button onClick={handleCopy} style={{...btnStyle, background: copied ? "#00c853" : "#222"}}>
          {copied ? "✔ Skopiowano" : "📋 Kopiuj"}
        </button>
      </div>
    </div>
  );
}
