import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

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
    const update = () => {
      if (window.innerWidth < 600) setColumns(1);
      else if (window.innerWidth < 1000) setColumns(2);
      else setColumns(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 🔥 BACKUP
  const exportData = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-prompts.json";
    a.click();
  };

  // 🔥 IMPORT + DEDUPE + OVERWRITE
  const importData = async (e, overwrite = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const data = JSON.parse(text);

    const snapshot = await getDocs(collection(db, "prompts"));
    const existingDocs = snapshot.docs;

    if (overwrite) {
      for (const d of existingDocs) {
        await deleteDoc(doc(db, "prompts", d.id));
      }
    }

    const existing = existingDocs.map(d => d.data());

    let added = 0;
    let skipped = 0;

    for (const item of data) {
      const isDuplicate = existing.some(p =>
        p.image === item.image || p.prompt === item.prompt
      );

      if (!overwrite && isDuplicate) {
        skipped++;
        continue;
      }

      await addDoc(collection(db, "prompts"), {
        ...item,
        createdAt: item.createdAt || Date.now()
      });

      added++;
    }

    alert(`✅ Dodano: ${added} | Pominięto duplikaty: ${skipped}`);
    loadPrompts();
  };

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

  const filtered = [...prompts]
    .filter(item => {
      if (filter === "all") return true;
      if (!item.fileType) return filter === "image";
      return item.fileType === filter;
    })
    .sort((a, b) => sort==="newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  const totalCount = filtered.length;
  const imageCount = filtered.filter(p => p.fileType !== "video").length;
  const videoCount = filtered.filter(p => p.fileType === "video").length;

  return (
    <div style={{ background: "#000", minHeight: "100vh", color:"white" }}>
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>

        <h1 style={{fontSize:"32px"}}>🔥 PLANETA PROMPTÓW</h1>

        {/* 🔥 DASHBOARD */}
        <div style={dashboard}>
          <div style={statCard}><div style={statNumber}>{totalCount}</div><div style={statLabel}>📦 Wszystkie</div></div>
          <div style={statCard}><div style={statNumber}>{imageCount}</div><div style={statLabel}>📸 Zdjęcia</div></div>
          <div style={statCard}><div style={statNumber}>{videoCount}</div><div style={statLabel}>🎬 Video</div></div>
        </div>

        {/* 🔥 BACKUP SYSTEM */}
        <div style={backupWrapper}>
          <button onClick={exportData} style={backupBtn}>💾 Backup</button>

          <label style={backupBtn}>
            📥 Import
            <input type="file" accept="application/json" onChange={(e)=>importData(e,false)} style={{display:"none"}} />
          </label>

          <label style={{...backupBtn, background:"#330000", border:"1px solid #ff4444"}}>
            ⚠️ Nadpisz bazę
            <input type="file" accept="application/json" onChange={(e)=>importData(e,true)} style={{display:"none"}} />
          </label>
        </div>

        {/* FORM */}
        <div style={cardStyle}>
          <label style={uploadBox}>
            📁 Wybierz plik
            <input type="file" onChange={(e)=>{
              const f = e.target.files?.[0];
              if (!f) return;
              setFile(f);
              setPreview(URL.createObjectURL(f));
            }} style={{display:"none"}}/>
          </label>

          {preview && <img src={preview} style={previewStyle}/>}

          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="✨ Wpisz prompt..." style={textareaStyle}/>

          <button onClick={savePrompt} style={mainBtn}>
            {uploading ? "⏳ Uploading..." : "DODAJ PROMPT"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* STYLE */
const dashboard = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "15px",
  marginBottom: "20px"
};

const statCard = {
  background: "linear-gradient(135deg,#111,#1a1a1a)",
  border: "1px solid #333",
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center"
};

const statNumber = { fontSize: "28px", fontWeight: "bold" };
const statLabel = { fontSize: "13px", opacity: 0.7 };

const backupWrapper = { display: "flex", gap: "10px", marginBottom: "15px" };

const backupBtn = {
  padding: "10px 16px",
  borderRadius: "12px",
  background: "#111",
  border: "1px solid #333",
  color: "white",
  cursor: "pointer"
};

const cardStyle = { background:"#111", padding:"20px", borderRadius:"16px", margin:"20px 0" };
const textareaStyle = { width:"100%", padding:"10px", borderRadius:"10px", margin:"10px 0", background:"#000", color:"white" };
const uploadBox = { display:"block", padding:"10px", border:"1px dashed #444", borderRadius:"10px", cursor:"pointer" };
const previewStyle = { width:"100%", borderRadius:"10px" };
const mainBtn = { width:"100%", padding:"12px", borderRadius:"12px", background:"linear-gradient(135deg,#ff0080,#7928ca)", border:"none", color:"white", cursor:"pointer", marginTop:"10px" };
