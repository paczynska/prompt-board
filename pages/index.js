function Editable({text="", onSave, showAbove=false}) {
  const [edit,setEdit]=useState(false);
  const [val,setVal]=useState(text);
  const [expanded,setExpanded]=useState(false);
  const [copied,setCopied]=useState(false);

  const clickAnim = (e)=>{
    e.currentTarget.style.transform = "scale(0.9)";
    setTimeout(()=> e.currentTarget.style.transform="scale(1)", 100);
  };

  const copy=()=>{
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false),1200);
  };

  const tiles = (
    <div style={tileRow}>
      {text.length>120 && (
        <div 
          onClick={(e)=>{clickAnim(e); setExpanded(!expanded)}} 
          style={tile}
        >
          {expanded ? "▲" : "▼"}
        </div>
      )}
      <div onClick={(e)=>{clickAnim(e); setEdit(true)}} style={tile}>✏️</div>
      <div 
        onClick={(e)=>{clickAnim(e); copy()}} 
        style={{...tile, background: copied ? "#00c853" : "#222"}}
      >
        {copied ? "✔" : "📋"}
      </div>
    </div>
  );

  if(edit){
    return(
      <div>
        {tiles}
        <textarea 
          value={val} 
          onChange={e=>setVal(e.target.value)} 
          style={{width:"100%", marginTop:"10px"}}
        />
        <button onClick={()=>{onSave(val);setEdit(false)}}>💾</button>
      </div>
    )
  }

  return(
    <div>
      {showAbove && tiles}

      {/* 🔥 ANIMACJA */}
      <div
        style={{
          overflow: "hidden",
          transition: "max-height 0.4s ease",
          maxHeight: expanded ? "1000px" : "80px"
        }}
      >
        <p style={{
          marginTop:"10px",
          whiteSpace:"pre-wrap",
          lineHeight:"1.5"
        }}>
          {text}
        </p>
      </div>

    </div>
  );
}
