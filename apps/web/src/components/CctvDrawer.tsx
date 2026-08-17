"use client";

import React, { useState } from "react";
import { X, Camera, Shield, Eye, Activity, Car, Bike, Bus, Truck, CheckCircle2, Radio } from "lucide-react";
import { NetworkSummary } from "@/types";

interface CctvDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: NetworkSummary | null;
  selectedCameraId?: string | null;
  onFocusCamera?: (camId: string) => void;
}

const DEFAULT_CAMERAS = [
  {
    cameraId: "cam_sitabuldi_01",
    name: "Sitabuldi North (Variety Sq Approach)",
    junctionId: "j_sitabuldi",
    lat: 21.1468,
    lon: 79.0832,
    fps: 28.4,
    confidence: 0.96,
    flowRateVpm: 42.5,
    queueMeters: 65.0,
    occupancyPct: 62.0,
    composition: { twoWheelers: 46, autoRickshaws: 22, cars: 24, buses: 6, trucks: 2 },
  },
  {
    cameraId: "cam_wardha_01",
    name: "Wardha Rd T-Point (Rahate Flyover)",
    junctionId: "j_wardha_rd",
    lat: 21.128,
    lon: 79.0756,
    fps: 29.1,
    confidence: 0.94,
    flowRateVpm: 36.0,
    queueMeters: 30.0,
    occupancyPct: 44.0,
    composition: { twoWheelers: 50, autoRickshaws: 18, cars: 25, buses: 5, trucks: 2 },
  },
  {
    cameraId: "cam_medical_01",
    name: "Medical Sq East (Ajni Approach)",
    junctionId: "j_medical_sq",
    lat: 21.1344,
    lon: 79.0968,
    fps: 27.8,
    confidence: 0.95,
    flowRateVpm: 29.0,
    queueMeters: 20.0,
    occupancyPct: 38.0,
    composition: { twoWheelers: 42, autoRickshaws: 20, cars: 28, buses: 7, trucks: 3 },
  },
  {
    cameraId: "cam_central_01",
    name: "Central Ave (Agrasen Sq Gandhibagh)",
    junctionId: "j_agrasen_sq",
    lat: 21.1534,
    lon: 79.1057,
    fps: 28.9,
    confidence: 0.97,
    flowRateVpm: 38.0,
    queueMeters: 45.0,
    occupancyPct: 52.0,
    composition: { twoWheelers: 38, autoRickshaws: 24, cars: 22, buses: 8, trucks: 8 },
  },
];

export const CctvDrawer: React.FC<CctvDrawerProps> = ({
  isOpen,
  onClose,
  data,
  selectedCameraId,
  onFocusCamera,
}) => {
  const [activeCamId, setActiveCamId] = useState<string>(selectedCameraId || "cam_sitabuldi_01");

  if (!isOpen) return null;

  const cameras = data?.cameras && data.cameras.length > 0 ? data.cameras : DEFAULT_CAMERAS;
  const currentCam = cameras.find((c: any) => c.cameraId === activeCamId) || cameras[0] || DEFAULT_CAMERAS[0];

  const composition = (currentCam as any).composition || {
    twoWheelers: 45,
    autoRickshaws: 20,
    cars: 25,
    buses: 6,
    trucks: 4,
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-end select-none animate-fade-in">
      <div className="w-full max-w-lg h-full glass-accent border-l border-border-subtle shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                CCTV &amp; Edge Vision Intelligence
                <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  SIMULATED
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Nagpur Smart City Edge Vision Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface hover:bg-surface-raised text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Zero-PII Compliance Banner */}
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-300 text-[11px]">Strict Zero-PII Guarantee:</span>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Edge models compute object bounding boxes and modal counts only. No facial recognition, no license plate indexing, and no raw video telemetry stored.
              </p>
            </div>
          </div>

          {/* Camera Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              Select Optical Stream
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cameras.map((cam: any) => {
                const isActive = cam.cameraId === currentCam.cameraId;
                return (
                  <button
                    key={cam.cameraId}
                    onClick={() => {
                      setActiveCamId(cam.cameraId);
                      onFocusCamera?.(cam.cameraId);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? "bg-indigo-500/15 border-indigo-500/50 text-white shadow-glow-blue"
                        : "bg-surface border-border-subtle text-slate-400 hover:text-slate-200 hover:bg-surface-raised"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] truncate">{cam.name.split("(")[0]}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{cam.cameraId}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated Video Frame Viewport */}
          <div className="relative w-full h-44 rounded-2xl bg-slate-950 border border-border-subtle overflow-hidden flex flex-col justify-between p-3">
            {/* Live stream grid simulation overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            {/* Bounding box simulation graphics */}
            <div className="absolute top-10 left-12 w-16 h-12 border border-emerald-400/80 rounded bg-emerald-400/10 flex items-start p-0.5">
              <span className="text-[8px] font-mono text-emerald-300 font-bold bg-black/60 px-1 rounded">2-WHEELER 0.94</span>
            </div>
            <div className="absolute top-16 right-16 w-24 h-16 border border-sky-400/80 rounded bg-sky-400/10 flex items-start p-0.5">
              <span className="text-[8px] font-mono text-sky-300 font-bold bg-black/60 px-1 rounded">CAR 0.97</span>
            </div>
            <div className="absolute bottom-6 left-28 w-20 h-14 border border-amber-400/80 rounded bg-amber-400/10 flex items-start p-0.5">
              <span className="text-[8px] font-mono text-amber-300 font-bold bg-black/60 px-1 rounded">AUTO 0.91</span>
            </div>

            {/* Stream HUD Top */}
            <div className="relative flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[9px] font-mono text-emerald-400">
                <Radio className="w-2.5 h-2.5 text-red-500 animate-pulse" />
                <span>FEED: RECORDED / SIMULATED</span>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[9px] font-mono text-slate-300">
                FPS: {(currentCam as any).fps || 29.2} • INFERENCE: 14ms
              </div>
            </div>

            {/* Stream HUD Bottom */}
            <div className="relative flex items-center justify-between z-10 text-[9px] font-mono text-slate-400">
              <span>CAMERA: {currentCam.name}</span>
              <span>CONF: {Math.round(((currentCam as any).confidence || 0.95) * 100)}%</span>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-surface border border-border-subtle text-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Flow Rate</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block">
                {(currentCam as any).flowRateVpm || 38.0}
              </span>
              <span className="text-[9px] text-slate-500">veh / min</span>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border-subtle text-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Occupancy</span>
              <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
                {Math.round((currentCam as any).occupancyPct || 55)}%
              </span>
              <span className="text-[9px] text-slate-500">lane capacity</span>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border-subtle text-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Queue Shock</span>
              <span className="text-base font-black text-sky-400 font-mono mt-0.5 block">
                {Math.round((currentCam as any).queueMeters || 40)}m
              </span>
              <span className="text-[9px] text-slate-500">spillback</span>
            </div>
          </div>

          {/* Modal Vehicle Class Composition Breakdown */}
          <div className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2.5">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              Vehicle Classification Breakdown
            </span>

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-emerald-400" /> Two-Wheelers (Motorcycles/Scooters)
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{composition.twoWheelers}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${composition.twoWheelers}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-sky-400" /> Cars &amp; Taxis
                  </span>
                  <span className="font-mono font-bold text-sky-400">{composition.cars}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${composition.cars}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" /> Auto-Rickshaws
                  </span>
                  <span className="font-mono font-bold text-amber-400">{composition.autoRickshaws}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${composition.autoRickshaws}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-purple-400" /> City Buses (Aapli Bus)
                  </span>
                  <span className="font-mono font-bold text-purple-400">{composition.buses}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${composition.buses}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-rose-400" /> Commercial Goods Vehicles
                  </span>
                  <span className="font-mono font-bold text-rose-400">{composition.trucks}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${composition.trucks}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle flex items-center justify-between text-[11px] text-slate-500">
          <span>Target: {currentCam.name.split("(")[0]}</span>
          <span className="text-emerald-400 font-mono">Edge RT-DETR/YOLOv8 Active</span>
        </div>
      </div>
    </div>
  );
};
