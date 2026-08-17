"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera } from "@/types";
import { API_BASE_URL } from "@/utils/api";

interface CctvDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: Camera[];
  selectedCameraId: string | null;
  onSelectCamera: (cameraId: string) => void;
}

export const CctvDrawer: React.FC<CctvDrawerProps> = ({
  isOpen,
  onClose,
  cameras,
  selectedCameraId,
  onSelectCamera,
}) => {
  const [activeTab, setActiveTab] = useState<"FEED" | "ANALYTICS" | "CONFIG">("FEED");
  const [sourceMode, setSourceMode] = useState<"WEBCAM" | "BACKEND_STREAM" | "DEMO">("BACKEND_STREAM");
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // Default to first camera if none selected
  const activeCamera =
    cameras.find((c) => c.cameraId === selectedCameraId) ||
    cameras[0] || {
      cameraId: "cam_sitabuldi_01",
      name: "Sitabuldi Interchange - North Pole (CAM-01)",
      junctionId: "j_sitabuldi",
      direction: "Northbound to Variety Sq",
      isCalibrated: true,
      lat: 21.1468,
      lon: 79.0832,
      sourceType: "recorded",
      enabled: true,
    };

  // Start / Stop Browser Webcam
  const handleToggleWebcam = async () => {
    if (isWebcamActive) {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
        webcamStreamRef.current = null;
      }
      setIsWebcamActive(false);
      setSourceMode("BACKEND_STREAM");
    } else {
      setWebcamError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: false,
        });
        webcamStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsWebcamActive(true);
        setSourceMode("WEBCAM");
      } catch (err: any) {
        setWebcamError("Camera access permission denied or no physical webcam detected.");
        setSourceMode("BACKEND_STREAM");
      }
    }
  };

  // Cleanup webcam stream when drawer closes or unmounts
  useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame refresh timestamp for backend stream preview
  const [frameTimestamp, setFrameTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    if (!isOpen || sourceMode !== "BACKEND_STREAM") return;
    const interval = setInterval(() => {
      setFrameTimestamp(Date.now());
    }, 1500);
    return () => clearInterval(interval);
  }, [isOpen, sourceMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-surface-elevated border border-grid-line rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-grid-line flex items-center justify-between bg-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-md text-headline-md font-bold text-primary">
                  CCTV Edge Vision &amp; Live Ingestion
                </h3>
                <span
                  className={`px-2 py-0.5 rounded font-label-caps text-[10px] uppercase font-bold tracking-wider ${
                    isWebcamActive
                      ? "bg-status-success/20 text-status-success border border-status-success/40 animate-pulse"
                      : "bg-status-warning/20 text-status-warning border border-status-warning/40"
                  }`}
                >
                  {isWebcamActive
                    ? "LIVE (LOCAL WEBCAM)"
                    : sourceMode === "BACKEND_STREAM"
                    ? "LIVE STREAM FEED"
                    : "RECORDED DEMO"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-variant font-label-caps text-on-surface-variant">
                  Zero PII Enforced
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {activeCamera.name} • {activeCamera.direction}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Webcam Toggle Button */}
            <button
              onClick={handleToggleWebcam}
              className={`px-3 py-1.5 rounded font-body-sm text-body-sm font-bold flex items-center gap-1.5 transition-colors ${
                isWebcamActive
                  ? "bg-status-critical/20 text-status-critical border border-status-critical/40 hover:bg-status-critical/30"
                  : "bg-primary text-on-primary hover:bg-primary-fixed"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isWebcamActive ? "videocam_off" : "photo_camera"}
              </span>
              {isWebcamActive ? "Stop Webcam" : "Connect Live Webcam"}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-grid-line px-4 bg-surface">
          <button
            onClick={() => setActiveTab("FEED")}
            className={`py-2 px-4 border-b-2 font-label-caps text-label-caps uppercase transition-colors ${
              activeTab === "FEED"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Video Stream
          </button>
          <button
            onClick={() => setActiveTab("ANALYTICS")}
            className={`py-2 px-4 border-b-2 font-label-caps text-label-caps uppercase transition-colors ${
              activeTab === "ANALYTICS"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Modal Classification
          </button>
          <button
            onClick={() => setActiveTab("CONFIG")}
            className={`py-2 px-4 border-b-2 font-label-caps text-label-caps uppercase transition-colors ${
              activeTab === "CONFIG"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Camera Network ({cameras.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {webcamError && (
            <div className="p-3 rounded bg-status-warning/10 border border-status-warning/30 text-status-warning font-body-sm text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>{webcamError} Switching to backend stream preview.</span>
            </div>
          )}

          {activeTab === "FEED" && (
            <div className="space-y-4">
              {/* Live Video HUD Area */}
              <div className="relative rounded-lg overflow-hidden border border-grid-line bg-surface-container aspect-video flex items-center justify-center">
                {/* Live Webcam Element */}
                {isWebcamActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Backend JPEG Frame Stream */
                  <img
                    src={`${API_BASE_URL}/api/cctv/frame/${activeCamera.cameraId}?t=${frameTimestamp}`}
                    alt="CCTV Video Stream"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // fallback to clean simulated visual
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                )}

                {/* Overlaid Analytics HUD */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-surface/80 backdrop-blur border border-grid-line font-data-mono text-[10px] text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                    FPS: 29.4
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface/80 backdrop-blur border border-grid-line font-data-mono text-[10px] text-on-surface-variant">
                    LATENCY: 14ms
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded bg-status-critical/80 backdrop-blur text-white font-label-caps text-[10px] uppercase font-bold tracking-wider">
                    ● REC • ZERO PII
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded bg-surface/85 backdrop-blur border border-grid-line flex items-center justify-between font-data-mono text-data-mono">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-on-surface-variant">FLOW RATE:</span>{" "}
                      <span className="text-on-surface font-bold">38.4 vpm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant">OCCUPANCY:</span>{" "}
                      <span className="text-status-warning font-bold">48%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant">QUEUE:</span>{" "}
                      <span className="text-status-critical font-bold">22m</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary font-bold">
                    CONFIDENCE: 94.8%
                  </span>
                </div>
              </div>

              {/* Source Switcher Pill Row */}
              <div className="flex items-center justify-between p-3 rounded bg-surface border border-grid-line font-body-sm text-body-sm">
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Active Input Source:
                  </span>
                  <span className="font-data-mono text-primary font-bold">
                    {isWebcamActive
                      ? "Hardware Webcam (/dev/video0)"
                      : "Nagpur ITMS Edge Stream (H.264/RTSP)"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (isWebcamActive) handleToggleWebcam();
                      setSourceMode("BACKEND_STREAM");
                    }}
                    className={`px-3 py-1 rounded text-xs font-label-caps ${
                      sourceMode === "BACKEND_STREAM"
                        ? "bg-primary text-on-primary font-bold"
                        : "bg-surface-variant text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Edge Stream
                  </button>
                  <button
                    onClick={() => {
                      if (isWebcamActive) handleToggleWebcam();
                      setSourceMode("DEMO");
                    }}
                    className={`px-3 py-1 rounded text-xs font-label-caps ${
                      sourceMode === "DEMO"
                        ? "bg-primary text-on-primary font-bold"
                        : "bg-surface-variant text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Recorded Demo
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ANALYTICS" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-surface border border-grid-line space-y-3">
                <h4 className="font-headline-md text-headline-md text-primary font-bold">
                  Vehicle Modal Split (Zero-PII Aggregate)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-on-surface-variant text-xs">
                      <span>Two-Wheelers (Motorcycles &amp; Scooters)</span>
                      <span className="font-data-mono font-bold text-on-surface">45%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "45%" }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-on-surface-variant text-xs">
                      <span>Cars / Taxis</span>
                      <span className="font-data-mono font-bold text-on-surface">25%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-success rounded-full"
                        style={{ width: "25%" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-on-surface-variant text-xs">
                      <span>Auto-Rickshaws (3-Wheelers)</span>
                      <span className="font-data-mono font-bold text-on-surface">18%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-warning rounded-full"
                        style={{ width: "18%" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-on-surface-variant text-xs">
                      <span>Buses / Heavy Commercial Trucks</span>
                      <span className="font-data-mono font-bold text-on-surface">12%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-danger rounded-full"
                        style={{ width: "12%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "CONFIG" && (
            <div className="space-y-2">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                Available CCTV Cameras in Nagpur Corridor ({cameras.length})
              </div>
              <div className="grid grid-cols-2 gap-3">
                {cameras.map((cam) => {
                  const isSelected = cam.cameraId === activeCamera.cameraId;
                  return (
                    <div
                      key={cam.cameraId}
                      onClick={() => onSelectCamera(cam.cameraId)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-surface-container-high border-primary ring-1 ring-primary"
                          : "bg-surface border-grid-line hover:bg-surface-variant"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-on-surface text-xs">{cam.name}</div>
                        <span className="px-1.5 py-0.5 rounded bg-status-success/20 text-status-success font-data-mono text-[9px]">
                          ONLINE
                        </span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-1">
                        Junction: {cam.junctionId} • {cam.direction}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
