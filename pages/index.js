import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

export default function Home() {
  const [prompts, setPrompts] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadPrompts = async () => {
    const snapshot = await getDocs(collection(db, "prompts"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPrompts(data);
  };

  useEffect(() => {
    loadPrompts();
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
      prompt,
      fileType: file.type.startsWith("video") ? "video" : "image",
      createdAt: Date.now()
    });

    setUploading(false);
    setFile(null);
    setPreview(null);
    setPrompt("");
    loadPrompts();
  };

  // 🔥 DRAG & DROP PODMIANY
  const handleDrop = async (e, id) => {
    e.preventDefault();

    const newFile = e.dataTransfer.files[0];
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

  return (
    <div style={{ background:"#000", minHeight:"100vh", color:"white", padding:"20px" }}>

      <h1>🔥 PLANETA PROMPTÓW</h1>

      {/* FORM */}
      <div style={card}>
        <input 
          type="file"
          onChange={(e)=>{
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
          }}
        />

        {preview && (
          preview.includes("video")
            ? <video src={preview} controls style={media}/>
            : <img src={preview} style={media}/>
        )}

        <textarea 
          value={prompt}
          onChange={e=>setPrompt(e.target.value)}
          placeholder="Wpisz prompt..."
          style={input}
        />

        <button onClick={savePrompt} style={btn}>
          {uploading ? "⏳ Uploading..." : "🚀 Dodaj"}
        </button>
      </div>

      {/* GRID */}
      <div style={{columnCount:3, columnGap:"20px"}}>
        {prompts.map(item => (
          <div 
            key={item.id} 
            style={cardMini}
            onDragOver={(e)=>e.preventDefault()}
            onDrop={(e)=>handleDrop(e, item.id)}
          >
            {item.fileType === "video" ? (
              <video src={item.image} controls style={media}/>
            ) : (
              <img src={item.image} style={media}/>
            )}

            <p style={{fontSize:"14px"}}>{item.prompt}</p>

            <p style={{opacity:0.5, fontSize:"12px"}}>
              ⬇️ Przeciągnij plik tutaj aby podmienić
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}

/* STYLE */
const card = {
  background:"#111",
  padding:"20px",
  borderRadius:"12px",
  marginBottom:"20px"
};

const cardMini = {
  background:"#1a1a1a",
  padding:"10px",
  borderRadius:"12px",
  marginBottom:"20px",
  breakInside:"avoid",
  border:"1px dashed #333"
};

const input = {
  width:"100%",
  marginTop:"10px",
  padding:"10px",
  background:"#000",
  color:"white"
};

const media = {
  width:"100%",
  borderRadius:"10px",
  marginTop:"10px"
};

const btn = {
  marginTop:"10px",
  padding:"10px",
  background:"#ff0080",
  color:"white",
  border:"none",
  borderRadius:"10px",
  cursor:"pointer"
};
