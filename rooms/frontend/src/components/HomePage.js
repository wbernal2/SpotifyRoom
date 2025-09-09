import React from "react";
import HomepageBackground from "../assets/images/HomepageBackground.png";
import { useNavigate } from "react-router-dom";

// Apple-style dark theme with subtle Spotify green accents
const THEME = {
  bg: "linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #0f0f10 50%, #0a0f0a 75%, #000000 100%)",
  cardBg: "rgba(255, 255, 255, 0.02)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  text: "#ffffff",
  textSecondary: "#a1a1a6",
  accent: "#1db954",
  accentHover: "#1ed760",
  glass: "backdrop-filter: blur(20px) saturate(180%)",
  shadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
};

const styles = {
  container: {
    background: `
      linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(10,10,10,0.8) 25%, rgba(15,15,16,0.75) 50%, rgba(10,15,10,0.8) 75%, rgba(0,0,0,0.7) 100%),
      url(${HomepageBackground})
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    height: "100vh",
    width: "100vw",
    position: "fixed",
    top: 0,
    left: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    overflow: "hidden"
  },
  card: {
    background: THEME.cardBg,
    border: THEME.border,
    borderRadius: "24px",
    padding: "100px 100px",
    textAlign: "center",
    maxWidth: "480px",
    width: "100%",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: THEME.shadow,
    position: "relative",
    overflow: "hidden"
  },
  cardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, rgba(29, 185, 84, 0.02) 0%, transparent 40%, transparent 60%, rgba(29, 185, 84, 0.01) 100%)",
    borderRadius: "24px",
    pointerEvents: "none"
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    color: THEME.text,
    marginBottom: "16px",
    letterSpacing: "-0.02em",
    lineHeight: "1.2"
  },
  subtitle: {
    fontSize: "20px",
    fontWeight: "400",
    color: THEME.textSecondary,
    marginBottom: "48px",
    letterSpacing: "-0.01em",
    lineHeight: "1.4"
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    alignItems: "center"
  },
  primaryButton: {
    background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentHover} 100%)`,
    color: "#000000",
    border: "none",
    borderRadius: "12px",
    padding: "16px 32px",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    width: "200px",
    position: "relative",
    overflow: "hidden"
  },
  secondaryButton: {
    background: "rgba(255, 255, 255, 0.04)",
    color: THEME.text,
    border: THEME.border,
    borderRadius: "12px",
    padding: "16px 32px",
    fontSize: "17px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    width: "200px",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)"
  }
};

// CSS for hover effects
const injectStyles = () => {
  if (typeof document !== "undefined") {
    const id = "homepage-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(29, 185, 84, 0.25);
          background: linear-gradient(135deg, #1ed760 0%, #21e065 100%) !important;
        }
        
        .primary-btn:active {
          transform: translateY(0);
        }
        
        .secondary-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          transform: translateY(-1px);
        }
        
        .secondary-btn:active {
          transform: translateY(0);
        }
        
        @media (max-width: 768px) {
          .homepage-card {
            padding: 40px 30px !important;
            margin: 20px !important;
          }
          
          .homepage-title {
            font-size: 28px !important;
          }
          
          .homepage-subtitle {
            font-size: 18px !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
};

export default function HomePage() {
  const navigate = useNavigate();
  
  // Inject styles on component mount
  React.useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card} className="homepage-card">
        <div style={styles.cardOverlay}></div>
        
        <h1 style={styles.title} className="homepage-title">
          Spotify Rooms
        </h1>
        
        <p style={styles.subtitle} className="homepage-subtitle">
          Listen together, vibe together.
        </p>
        
        <div style={styles.buttonContainer}>
          <button 
            style={styles.primaryButton}
            className="primary-btn"
            onClick={() => navigate("/create")}
          >
            Create Room
          </button>
          
          <button 
            style={styles.secondaryButton}
            className="secondary-btn"
            onClick={() => navigate("/join")}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
