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

          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} style={textareaStyle} />

          <button onClick={savePrompt} style={mainBtn}>
            {uploading ? "⏳ Uploading..." : "DODAJ PROMPT"}
          </button>
        </div>

        <div style={tabsWrapper}>
          <div onClick={()=>setFilter("all")} style={{...tab, ...(filter==="all" ? activeTab : {})}}>🌍</div>
          <div onClick={()=>setFilter("image")} style={{...tab, ...(filter==="image" ? activeTab : {})}}>📸</div>
          <div onClick={()=>setFilter("video")} style={{...tab, ...(filter==="video" ? activeTab : {})}}>🎬</div>
        </div>

        <div style={{columnCount:columns, columnGap:"20px"}}>
          {[...prompts]
            .filter(item => filter==="all" || !item.fileType || item.fileType===filter)
            .map(item => (
              <div key={item.id} style={cardMini}>

                <div style={imageWrapper}>
                  {item.fileType==="video"
                    ? <video src={item.image} controls style={previewStyle}/>
                    : <img src={item.image} style={previewStyle}/>
                  }

                  <label style={replaceBtn}>
                    🔄
                    <input type="file" onChange={(e)=>replaceImage(item.id, e.target.files[0])} style={{display:"none"}} />
                  </label>
                </div>

                <Editable text={item.prompt||""} onSave={(t)=>editPrompt(item.id,t)} showAbove />

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
const inputStyle = { width:"100%", padding:"10px", borderRadius:"10px", margin:"10px 0", background:"#000", color:"white" };
const textareaStyle = { width:"100%", padding:"10px", borderRadius:"10px", background:"#000", color:"white" };
const uploadBox = { display:"block", padding:"10px", border:"1px dashed #444", borderRadius:"10px" };
const previewStyle = { width:"100%", borderRadius:"10px" };
const mainBtn = { width:"100%", padding:"12px", borderRadius:"12px", background:"#ff0080", color:"white" };

const imageWrapper = { position:"relative" };
const replaceBtn = { position:"absolute", bottom:"10px", right:"10px", background:"#000", padding:"8px", borderRadius:"10px" };

const tabsWrapper = { display:"flex", gap:"10px", margin:"15px 0" };
const tab = { padding:"10px", background:"#111", borderRadius:"10px", cursor:"pointer" };
const activeTab = { background:"#ff0080" };

const tileRow = { display:"flex", gap:"10px", marginTop:"8px" };
const tile = { flex:1, textAlign:"center", padding:"8px", background:"#222", borderRadius:"10px", cursor:"pointer" };

const overlay = {
  position:"fixed",
  top:0,
  left:0,
  width:"100%",
  height:"100%",
  background:"rgba(0,0,0,0.95)",
  zIndex:99999,
  display:"flex",
  justifyContent:"center",
  alignItems:"center",
  padding:"20px"
};

const editorBox = {
  width:"100%",
  maxWidth:"600px",
  background:"#111",
  padding:"20px",
  borderRadius:"16px"
};

const editorTextarea = {
  width:"100%",
  height:"300px",
  background:"#000",
  color:"white",
  borderRadius:"10px",
  padding:"10px"
};

function Editable({text="", onSave, showAbove=false}) {
  const [edit,setEdit]=useState(false);
  const [val,setVal]=useState(text);

  return(
    <div>

      {showAbove && (
        <div style={tileRow}>
          <div onClick={()=>setEdit(true)} style={tile}>✏️ EDYTUJ</div>
        </div>
      )}

      <p>{text.slice(0,120)}...</p>

      {edit && (
        <div style={overlay}>
          <div style={editorBox}>
            <textarea value={val} onChange={e=>setVal(e.target.value)} style={editorTextarea}/>
            <button onClick={()=>{onSave(val);setEdit(false)}}>💾 ZAPISZ</button>
            <button onClick={()=>setEdit(false)}>❌</button>
          </div>
        </div>
      )}

    </div>
  );
}
