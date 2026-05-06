import React from "react"
import ReactDOM from "react-dom/client"
import Bowl3D from "@/components/ui/bowl-3d"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
    <Bowl3D noteCount={10} width={800} height={600} />
  </div>
)
