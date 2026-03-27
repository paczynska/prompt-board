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
  const [sort, setSort] = useState("newest");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [columns, setColumns] = useState(3);

  const loadPrompts = async () => {
    const snapshot = await getDocs(collection(db, "prompts"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPrompts(data);
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    if (mediaType === "video") setType("veo3");
    else setType("chatgpt");
  }, [mediaType]);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 600) setColumns(1);
      else if (window.innerWidth < 1000) setColumns(2);
      else setColumns(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");
    formData.append("resource_type", "auto");

    const res = await fetch("https://api.cloudinary.com/v1_1/ddrasgbno/auto/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    return data.secure_url;
  };

  const savePrompt = async () => {
    if (!file) return alert("Dodaj plik!");
    setUploading(true);

    const snapshot = await getDocs(collection(db, "prompts"));
    const all = snapshot.docs.map(doc => doc.data());

    const maxNumber = all.length > 0
      ? Math.max(...all.map(p => p.number || 0))
      : 0;

    const newNumber = maxNumber + 1;

    const url = await uploadFile(file);

    await addDoc(collection(db, "prompts"), {
      image: url,
      prompt: prompt || "",
      type,
      number: newNumber,
      fileType: file.type.startsWith("video") ? "video" : "image",
      createdAt: Date.now()
    });

    setUploading(false);
    setFile(null);
    setPreview(null);
    setPrompt("");
    loadPrompts();
  };

  const replaceImage = async (id, newFile) => {
    if (!newFile) return;
    setUploading(true);

    const url = await uploadFile(newFile);
    const ref = doc(db, "prompts", id);

    await updateDoc(ref, {
      image: url,
      fileType: newFile.type.startsWith("video") ? "video" : "image"
    });

    setUploading(false);
    loadPrompts();
  };

  const editPrompt = async (id, newPrompt) => {
    const ref = doc(db, "prompts", id);
    await updateDoc(ref, { prompt: newPrompt });
    loadPrompts();
  };

  const updateType = async (id, newType) => {
    const ref = doc(db, "prompts", id);
    await updateDoc(ref, { type: newType });
    loadPrompts();
  };

  const filtered = [...prompts]
    .filter(item => {
      if (filter === "all") return true;
      if (!item.fileType) return filter === "image";
      return item.fileType === filter;
    })
    .sort((a, b) => sort==="newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  return (
    <div style={{ background: "#000", minHeight: "100vh", color:"white" }}>
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>

        <h1 style={{fontSize:"32px"}}>🔥 PLANETA PROMPTÓW</h1>

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

          <select value={type} onChange={e=>setType(e.target.value)} style={inputStyle}>
            {mediaType === "video"
              ? <option value="veo3">🎬 Veo3</option>
              : <>
                  <option value="chatgpt">🤖 CHATGPT</option>
                  <option value="nanobanana">🍌 NANOBANANA</option>
                  <option value="grok">🧠 GROK</option>
                </>
            }
          </select>

          <button onClick={savePrompt} style={mainBtn}>
            {uploading ? "⏳ Uploading..." : "DODAJ PROMPT"}
          </button>
        </div>

        <select value={sort} onChange={(e)=>setSort(e.target.value)} style={inputStyle}>
          <option value="newest">🆕 Najnowsze</option>
          <option value="oldest">📜 Najstarsze</option>
        </select>

        <div style={tabsWrapper}>
          <div onClick={()=>setFilter("all")} style={{...tab, ...(filter==="all" ? activeTab : {})}}>🌍 Wszystko</div>
          <div onClick={()=>setFilter("image")} style={{...tab, ...(filter==="image" ? activeTab : {})}}>📸 Zdjęcia</div>
          <div onClick={()=>setFilter("video")} style={{...tab, ...(filter==="video" ? activeTab : {})}}>🎬 Video</div>
        </div>

        <div style={{columnCount:columns, columnGap:"20px"}}>
          {filtered.map((item, index) => (
            <div key={item.id} style={cardMini}>

              {/* 🔥 NUMER PRAWA → GÓRA */}
              <div style={numberBadge}>
                {(() => {
                  const total = filtered.length;
                  const cols = columns;
                  const rows = Math.ceil(total / cols);

                  const col = index % cols;
                  const row = Math.floor(index / cols);

                  const reversedRow = rows - row - 1;
                  const reversedCol = cols - col - 1;

                  const newIndex = reversedCol * rows + reversedRow;

                  return `#${newIndex + 1}`;
                })()}
              </div>

              <div style={imageWrapper}>
                {item.fileType==="video"
                  ? <video src={item.image} controls style={previewStyle}/>
                  : <img src={item.image} style={previewStyle}/>
                }

                <label style={replaceBtn}>
                  🔄
                  <input type="file" accept="image/*,video/*" onChange={(e)=>replaceImage(item.id, e.target.files[0])} style={{display:"none"}} />
                </label>
              </div>

              <Editable text={item.prompt||""} onSave={(t)=>editPrompt(item.id,t)} />

              <select
                value={item.type}
                onChange={(e)=>updateType(item.id, e.target.value)}
                style={{
                  width:"100%",
                  padding:"6px",
                  borderRadius:"8px",
                  marginTop:"8px",
                  background:"#000",
                  color:"white",
                  border:"1px solid #333",
                  fontSize:"12px"
                }}
              >
                {item.fileType === "video" ? (
                  <option value="veo3">🎬 Veo3</option>
                ) : (
                  <>
                    <option value="chatgpt">🤖 ChatGPT</option>
                    <option value="nanobanana">🍌 NanoBanana</option>
                    <option value="grok">🧠 Grok</option>
                  </>
                )}
              </select>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* STYLE */
const cardStyle = { background:"#111", padding:"20px", borderRadius:"16px", margin:"20px 0" };

const cardMini = { 
  breakInside:"avoid",
  background:"#1a1a1a", 
  padding:"10px", 
  borderRadius:"12px", 
  marginBottom:"20px",
  position:"relative"
};

const inputStyle = { width:"100%", padding:"10px", borderRadius:"10px", margin:"10px 0", background:"#000", color:"white", border:"1px solid #333" };
const textareaStyle = { width:"100%", padding:"10px", borderRadius:"10px", margin:"10px 0", background:"#000", color:"white" };
const uploadBox = { display:"block", padding:"10px", border:"1px dashed #444", borderRadius:"10px", cursor:"pointer" };
const previewStyle = { width:"100%", borderRadius:"10px", display:"block" };
const mainBtn = { width:"100%", padding:"12px", borderRadius:"12px", background:"linear-gradient(135deg,#ff0080,#7928ca)", border:"none", color:"white", cursor:"pointer", marginTop:"10px" };

const imageWrapper = { position:"relative" };

const replaceBtn = {
  position:"absolute",
  bottom:"10px",
  right:"10px",
  background:"rgba(0,0,0,0.85)",
  color:"white",
  borderRadius:"12px",
  padding:"8px 10px",
  cursor:"pointer",
  zIndex:9999
};

const numberBadge = {
  position: "absolute",
  top: "10px",
  left: "10px",
  background: "rgba(0,0,0,0.85)",
  color: "white",
  padding: "6px 10px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold",
  zIndex: 10
};

const tabsWrapper = { display:"flex", gap:"10px", margin:"15px 0" };

const tab = {
  padding:"10px 16px",
  borderRadius:"12px",
  background:"#111",
  border:"1px solid #333",
  cursor:"pointer",
  color:"#aaa"
};

const activeTab = {
  background:"linear-gradient(135deg,#ff0080,#7928ca)",
  color:"white",
  border:"none"
};

function Editable({text="", onSave}) {
  const [edit,setEdit]=useState(false);
  const [val,setVal]=useState(text);
  const [copied,setCopied]=useState(false);

  const copy=()=>{
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false),1200);
  };

  if(edit){
    return(
      <div>
        <textarea value={val} onChange={e=>setVal(e.target.value)} style={{width:"100%"}}/>
        <button onClick={()=>{onSave(val);setEdit(false)}}>💾</button>
      </div>
    )
  }

  return(
    <div style={{marginTop:"10px"}}>
      <div style={{display:"flex", gap:"10px", marginBottom:"8px"}}>
        <div onClick={()=>setEdit(true)} style={tile}>✏️</div>
        <div onClick={copy} style={{...tile, background: copied ? "#00c853" : "#222"}}>
          {copied ? "✔" : "📋"}
        </div>
      </div>

      <div style={promptBox}>
        {text}
      </div>
    </div>
  );
}

const tile = {
  flex:1,
  textAlign:"center",
  padding:"8px",
  borderRadius:"10px",
  background:"#222",
  cursor:"pointer"
};

const promptBox = {
  whiteSpace: "pre-wrap",
  background: "#000",
  padding: "12px",
  borderRadius: "12px",
  fontSize: "13px",
  lineHeight: "1.6",
  border: "1px solid #333",
  maxHeight: "250px",
  overflowY: "auto"
};
