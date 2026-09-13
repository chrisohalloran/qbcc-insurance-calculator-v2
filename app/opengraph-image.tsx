import { ImageResponse } from "next/og";
export const alt =
  "QBCC Insurance Calculator — estimate QBCC premiums and QLeave";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 76,
          background: "#14283f",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#a7d4c8" }}>
          QUEENSLAND BUILDING COSTS
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          <span>QBCC insurance.</span>
          <span>QLeave. One estimate.</span>
        </div>
        <div style={{ fontSize: 26 }}>
          Free calculator · New homes & renovations
        </div>
      </div>
    ),
    size,
  );
}
