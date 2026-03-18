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

  // 🔥 RESPONSIVE GRID
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

    const url = await uploadFile(file);

    await addDoc(collection(db, "prompts"), {
      image: url,
      prompt: prompt || "",
      type,
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

        {/* SORT */}
        <select value={sort} onChange={(e)=>setSort(e.target.value)} style={inputStyle}>
          <option value="newest">🆕 Najnowsze</option>
          <option value="oldest">📜 Najstarsze</option>
        </select>

        {/* TABS */}
        <div style={tabsWrapper}>
          <div onClick={()=>setFilter("all")} style={{...tab, ...(filter==="all" ? activeTab : {})}}>🌍 Wszystko</div>
          <div onClick={()=>setFilter("image")} style={{...tab, ...(filter==="image" ? activeTab : {})}}>📸 Zdjęcia</div>
          <div onClick={()=>setFilter("video")} style={{...tab, ...(filter==="video" ? activeTab : {})}}>🎬 Video</div>
        </div>

        {/* GRID */}
        <div style={{columnCount:columns, columnGap:"20px"}}>
          {[...prompts]
            .filter(item => {
              if (filter === "all") return true;
              if (!item.fileType) return filter === "image"; // 🔥 fix starych danych
              return item.fileType === filter;
            })
            .sort((a, b) => sort==="newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt)
            .map(item => (
              <div key={item.id} style={cardMini}>

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

                <Editable text={item.prompt||""} onSave={(t)=>editPrompt(item.id,t)} showAbove />

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
const cardStyle = { background:"#111", padding:"20px", borderRadius:"16px", margin:"20px 0" };
const cardMini = { breakInside:"avoid", background:"#1a1a1a", padding:"10px", borderRadius:"12px", marginBottom:"20px" };
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

const tileRow = { display:"flex", gap:"10px", marginTop:"8px" };

const tile = {
  flex:1,
  textAlign:"center",
  padding:"8px",
  borderRadius:"10px",
  background:"#222",
  cursor:"pointer"
};

function Editable({text="", onSave, showAbove=false}) {
  const [edit,setEdit]=useState(false);
  const [val,setVal]=useState(text);
  const [expanded,setExpanded]=useState(false);
  const [copied,setCopied]=useState(false);

  const copy=()=>{
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false),1200);
  };

  const tiles = (
    <div style={tileRow}>
      {text.length>120 && (
        <div onClick={()=>setExpanded(!expanded)} style={tile}>
          {expanded ? "▲" : "▼"}
        </div>
      )}
      <div onClick={()=>setEdit(true)} style={tile}>✏️</div>
      <div onClick={copy} style={{...tile, background: copied ? "#00c853" : "#222"}}>
        {copied ? "✔" : "📋"}
      </div>
    </div>
  );

  if(edit){
    return(
      <div>
        {tiles}
        <textarea value={val} onChange={e=>setVal(e.target.value)} style={{width:"100%"}}/>
        <button onClick={()=>{onSave(val);setEdit(false)}}>💾</button>
      </div>
    )
  }

  return(
    <div>
      {showAbove && tiles}
      <p>
        {expanded ? text : text.slice(0,120)}
        {text.length>120 && !expanded && "..."}
      </p>
    </div>
  );
}
