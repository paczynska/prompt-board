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

  // AUTO AI
  useEffect(() => {
    if (mediaType === "video") setType("veo3");
    else setType("chatgpt");
  }, [mediaType]);

  // 🔥 TŁUMACZ
  const translateText = async (text, targetLang) => {
    try {
      const res = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          q: text,
          source: "auto",
          target: targetLang,
          format: "text"
        })
      });
      const data = await res.json();
      return data.translatedText;
    } catch {
      alert("Błąd tłumaczenia 😅");
      return text;
    }
  };

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
    <div style={{ background: "#000", minHeight: "100vh", color:"white" }}>
      
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>

        <h1 style={{fontSize:"32px"}}>🔥 PLANETA PROMPTÓW</h1>

        {/* FORM */}
        <div style={cardStyle}>

          <select value={mediaType} onChange={(e)=>setMediaType(e.target.value)} style={inputStyle}>
            <option value="image">📸 OBRAZ</option>
            <option value="video">🎬 VIDEO</option>
          </select>

          <label style={uploadBox}>
            📁 Wybierz plik
            <input 
              type="file"
              accept={mediaType === "video" ? "video/*" : "image/*"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFile(f);
                setPreview(URL.createObjectURL(f));
                setMediaType(f.type.startsWith("video") ? "video" : "image");
              }}
              style={{display:"none"}}
            />
          </label>

          {preview && (
            mediaType === "video"
              ? <video src={preview} controls style={previewStyle}/>
              : <img src={preview} style={previewStyle}/>
          )}

          <textarea 
            value={prompt}
            onChange={e=>setPrompt(e.target.value)}
            placeholder="✨ Wpisz prompt..."
            style={textareaStyle}
          />

          {/* 🔥 TŁUMACZ */}
          <div style={{display:"flex", gap:"10px"}}>
            <button onClick={async()=>setPrompt(await translateText(prompt,"en"))} style={btnStyle}>
              🇵🇱→🇬🇧
            </button>
            <button onClick={async()=>setPrompt(await translateText(prompt,"pl"))} style={btnStyle}>
              🇬🇧→🇵🇱
            </button>
          </div>

          {/* SELECT AI */}
          <select value={type} onChange={e=>setType(e.target.value)} style={inputStyle}>
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

          <button onClick={savePrompt} style={mainBtn}>
            🚀 Dodaj prompt
          </button>

        </div>

        {/* GRID */}
        <div style={{columnCount:3, columnGap:"20px"}}>
          {prompts.map(item => (
            <div key={item.id} style={cardMini}>

              {item.fileType==="video"
                ? <video src={item.image} controls style={previewStyle}/>
                : <img src={item.image} style={previewStyle}/>
              }

              <Editable text={item.prompt||""} onSave={(t)=>editPrompt(item.id,t)}/>

              <p style={{opacity:0.6,fontSize:"12px"}}>
                {item.type==="chatgpt" && "🤖 ChatGPT"}
                {item.type==="nanobanana" && "🍌 NanoBanana"}
                {item.type==="veo3" && "🎬 Veo3"}
                {item.type==="grok" && "🧠 Grok"}
              </p>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* STYLE */
const cardStyle = {
  background:"#111",
  padding:"20px",
  borderRadius:"16px",
  margin:"20px 0"
};

const cardMini = {
  breakInside:"avoid",
  background:"#1a1a1a",
  padding:"10px",
  borderRadius:"12px",
  marginBottom:"20px"
};

const inputStyle = {
  width:"100%",
  padding:"10px",
  borderRadius:"10px",
  margin:"10px 0",
  background:"#000",
  color:"white",
  border:"1px solid #333"
};

const textareaStyle = {
  width:"100%",
  padding:"10px",
  borderRadius:"10px",
  margin:"10px 0",
  background:"#000",
  color:"white"
};

const uploadBox = {
  display:"block",
  padding:"10px",
  border:"1px dashed #444",
  borderRadius:"10px",
  cursor:"pointer"
};

const previewStyle = {
  width:"100%",
  borderRadius:"10px",
  marginTop:"10px"
};

const mainBtn = {
  width:"100%",
  padding:"12px",
  borderRadius:"12px",
  background:"linear-gradient(135deg,#ff0080,#7928ca)",
  border:"none",
  color:"white",
  cursor:"pointer",
  marginTop:"10px"
};

const btnStyle = {
  background:"#222",
  color:"white",
  border:"none",
  padding:"6px 10px",
  borderRadius:"8px",
  cursor:"pointer"
};

function Editable({text="", onSave}) {
  const [edit,setEdit]=useState(false);
  const [val,setVal]=useState(text);
  const [expanded,setExpanded]=useState(false);
  const [copied,setCopied]=useState(false);

  const copy=()=>{
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false),1500);
  };

  if(edit){
    return(
      <div>
        <textarea value={val} onChange={e=>setVal(e.target.value)}/>
        <button onClick={()=>{onSave(val);setEdit(false)}}>💾</button>
      </div>
    )
  }

  return(
    <div>
      <p>
        {expanded ? text : text.slice(0,120)}
        {text.length>120 && !expanded && "..."}
      </p>

      <div style={{display:"flex",gap:"10px"}}>
        {text.length>120 && (
          <button onClick={()=>setExpanded(!expanded)} style={btnStyle}>
            {expanded?"▲":"▼"}
          </button>
        )}
        <button onClick={()=>setEdit(true)} style={btnStyle}>✏️</button>
        <button onClick={copy} style={btnStyle}>
          {copied?"✔":"📋"}
        </button>
      </div>
    </div>
  );
}
