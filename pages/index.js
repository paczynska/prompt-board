import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

export default function Home() {
  const [prompts, setPrompts] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("chatgpt");
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState("image");

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
      width: "100%"
    }}>
      
      <div style={{
        padding: "20px 40px",
        width: "100%",
        color: "white"
      }}>

        <h1 style={{fontSize:"32px", marginBottom:"20px"}}>🔥 Prompt Board</h1>

        {/* FORM */}
        <div style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}>

          {/* WYBÓR MEDIA */}
          <select 
            value={mediaType} 
            onChange={(e)=>setMediaType(e.target.value)}
            style={{marginBottom:"10px", padding:"8px"}}
          >
            <option value="image">📸 Obraz</option>
            <option value="video">🎬 Video (Veo3)</option>
          </select>

          {/* OPIS */}
          <p style={{fontSize:"12px", opacity:0.6}}>
            {mediaType === "video" ? "🎬 Dodaj video z Veo3" : "📸 Dodaj obraz"}
          </p>

          {/* INPUT */}
          <input 
            type="file" 
            accept={mediaType === "video" ? "video/mp4" : "image/*"}
            onChange={(e) => setFile(e.target.files[0])}
            style={{marginBottom:"10px"}}
          />

          <textarea 
            placeholder="Wpisz prompt..." 
            value={prompt} 
            onChange={e=>setPrompt(e.target.value)}
            style={{
              width:"100%",
              padding:"10px",
              borderRadius:"10px",
              marginBottom:"10px",
              border:"none"
            }}
          />

          <select 
            value={type} 
            onChange={e=>setType(e.target.value)}
            style={{marginBottom:"10px", padding:"8px"}}
          >
            <option value="chatgpt">🤖 ChatGPT</option>
            <option value="nanobanana">🍌 NanoBanana</option>
          </select>

          <button 
            onClick={savePrompt}
            style={{
              background:"linear-gradient(135deg,#ff4d4d,#ff0080)",
              border:"none",
              padding:"10px 20px",
              borderRadius:"12px",
              color:"white",
              cursor:"pointer"
            }}
          >
            💾 Zapisz
          </button>
        </div>

        {/* GRID */}
        <div style={{
          columnCount: 4,
          columnGap: "20px"
        }}>
          {prompts.map((item) => (
            <div 
              key={item.id} 
              style={{
                breakInside: "avoid",
                marginBottom: "25px",
                background: "#1a1a1a",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                transition: "0.3s"
              }}
              onMouseEnter={(e)=>{
                e.currentTarget.style.transform="translateY(-8px)";
                e.currentTarget.style.boxShadow="0 20px 40px rgba(0,0,0,0.8)";
              }}
              onMouseLeave={(e)=>{
                e.currentTarget.style.transform="translateY(0)";
                e.currentTarget.style.boxShadow="0 10px 25px rgba(0,0,0,0.5)";
              }}
            >
              
              {item.fileType === "video" ? (
                <video 
                  src={item.image}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    borderRadius: "12px"
                  }}
                />
              ) : (
                <img 
                  src={item.image} 
                  alt="img"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "12px",
                    display: "block"
                  }}
                />
              )}

              <div style={{
                padding:"10px",
                background:"#1a1a1a"
              }}>
                <Editable 
                  text={item.prompt.length > 120 
                    ? item.prompt.slice(0,120) + "..." 
                    : item.prompt
                  } 
                  onSave={(t)=>editPrompt(item.id, t)} 
                />

                <p style={{
                  opacity: 0.6,
                  fontSize: "12px",
                  marginTop: "5px"
                }}>
                  {item.type === "chatgpt" ? "🤖 ChatGPT" : "🍌 NanoBanana"}
                </p>
              </div>

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

  return edit ? (
    <div>
      <textarea value={val} onChange={e=>setVal(e.target.value)} />
      <button onClick={()=>{onSave(val); setEdit(false)}}>💾</button>
    </div>
  ) : (
    <p onClick={()=>setEdit(true)} style={{cursor:"pointer"}}>
      {text}
    </p>
  );
}
