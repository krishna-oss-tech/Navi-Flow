"use client";

import React, { useState } from "react";
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
  const currentCam =
    cameras.find((c: any) => c.cameraId === activeCamId) || cameras[0] || DEFAULT_CAMERAS[0];

  const composition = (currentCam as any).composition || {
    twoWheelers: 45,
    autoRickshaws: 20,
    cars: 25,
    buses: 6,
    trucks: 4,
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-end select-none animate-fade-in">
      <div className="w-full max-w-lg h-full bg-surface-elevated border-l border-grid-line shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="p-5 border-b border-grid-line bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-primary/10 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                CCTV &amp; Edge Vision
                <span className="font-data-mono text-data-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                  SIMULATED
                </span>
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Nagpur Smart City Edge Vision Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Zero-PII Compliance Banner */}
          <div className="p-3.5 rounded-lg bg-surface-container border border-primary/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
              shield
            </span>
            <div>
              <span className="font-bold text-primary font-body-sm text-body-sm">
                Strict Zero-PII Guarantee:
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
                Edge models compute aggregate bounding boxes and modal counts only. Zero facial recognition, zero license plate indexing, and no raw video stored.
              </p>
            </div>
          </div>

          {/* Camera Selector Tabs */}
          <div className="space-y-1.5">
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block">
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
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isActive
                        ? "bg-surface-container-high border-primary text-primary shadow-lg shadow-cyan-500/10"
                        : "bg-surface border-grid-line text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-body-sm text-body-sm truncate">
                        {cam.name.split("(")[0]}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shrink-0" />
                    </div>
                    <span className="font-data-mono text-data-mono text-on-surface-variant block mt-0.5">
                      {cam.cameraId}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated Video Frame Viewport */}
          <div className="relative w-full h-48 rounded-xl bg-surface-container-lowest border border-grid-line overflow-hidden flex flex-col justify-between p-3.5">
            {/* Live stream grid simulation overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

            {/* Bounding box simulation graphics */}
            <div className="absolute top-12 left-12 w-16 h-12 border border-status-success/80 rounded bg-status-success/10 flex items-start p-0.5">
              <span className="font-data-mono text-[9px] text-status-success font-bold bg-black/70 px-1 rounded">
                2-WHEELER 0.94
              </span>
            </div>
            <div className="absolute top-16 right-16 w-24 h-16 border border-primary/80 rounded bg-primary/10 flex items-start p-0.5">
              <span className="font-data-mono text-[9px] text-primary font-bold bg-black/70 px-1 rounded">
                CAR 0.97
              </span>
            </div>
            <div className="absolute bottom-6 left-28 w-20 h-14 border border-status-warning/80 rounded bg-status-warning/10 flex items-start p-0.5">
              <span className="font-data-mono text-[9px] text-status-warning font-bold bg-black/70 px-1 rounded">
                AUTO 0.91
              </span>
            </div>

            {/* Stream HUD Top */}
            <div className="relative flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-white/10 font-data-mono text-data-mono text-status-success">
                <span className="w-2 h-2 rounded-full bg-status-critical animate-pulse" />
                <span>FEED: RECORDED / SIMULATED</span>
              </div>
              <div className="px-2 py-0.5 rounded bg-black/80 border border-white/10 font-data-mono text-data-mono text-on-surface">
                FPS: {(currentCam as any).fps || 29.2} • INFERENCE: 14ms
              </div>
            </div>

            {/* Stream HUD Bottom */}
            <div className="relative flex items-center justify-between z-10 font-data-mono text-data-mono text-on-surface-variant">
              <span className="truncate">{currentCam.name}</span>
              <span className="shrink-0 ml-2">
                CONF: {Math.round(((currentCam as any).confidence || 0.95) * 100)}%
              </span>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-lg bg-surface border border-grid-line text-center">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block">
                Flow Rate
              </span>
              <span className="font-display-metrics text-headline-lg font-bold text-on-surface font-mono mt-0.5 block">
                {(currentCam as any).flowRateVpm || 38.0}
              </span>
              <span className="font-data-mono text-data-mono text-on-surface-variant">vpm</span>
            </div>

            <div className="p-3.5 rounded-lg bg-surface border border-grid-line text-center">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block">
                Occupancy
              </span>
              <span className="font-display-metrics text-headline-lg font-bold text-status-warning font-mono mt-0.5 block">
                {Math.round((currentCam as any).occupancyPct || 55)}%
              </span>
              <span className="font-data-mono text-data-mono text-on-surface-variant">capacity</span>
            </div>

            <div className="p-3.5 rounded-lg bg-surface border border-grid-line text-center">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block">
                Queue Shock
              </span>
              <span className="font-display-metrics text-headline-lg font-bold text-primary font-mono mt-0.5 block">
                {Math.round((currentCam as any).queueMeters || 40)}m
              </span>
              <span className="font-data-mono text-data-mono text-on-surface-variant">spillback</span>
            </div>
          </div>

          {/* Modal Vehicle Class Composition Breakdown */}
          <div className="p-4 rounded-lg bg-surface-container border border-grid-line space-y-3">
            <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider block">
              Vehicle Classification Breakdown
            </span>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Two-Wheelers (Motorcycles/Scooters)</span>
                  <span className="font-data-mono text-data-mono font-bold text-status-success">
                    {composition.twoWheelers}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
                  <div
                    className="h-full bg-status-success rounded-full"
                    style={{ width: `${composition.twoWheelers}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Cars &amp; Taxis</span>
                  <span className="font-data-mono text-data-mono font-bold text-primary">
                    {composition.cars}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${composition.cars}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Auto-Rickshaws</span>
                  <span className="font-data-mono text-data-mono font-bold text-status-warning">
                    {composition.autoRickshaws}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
                  <div
                    className="h-full bg-status-warning rounded-full"
                    style={{ width: `${composition.autoRickshaws}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">City Buses (Aapli Bus)</span>
                  <span className="font-data-mono text-data-mono font-bold text-secondary">
                    {composition.buses}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full"
                    style={{ width: `${composition.buses}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Commercial Goods Vehicles</span>
                  <span className="font-data-mono text-data-mono font-bold text-status-critical">
                    {composition.trucks}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
                  <div
                    className="h-full bg-status-critical rounded-full"
                    style={{ width: `${composition.trucks}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-grid-line bg-surface-container-low flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
          <span>Target: {currentCam.name.split("(")[0]}</span>
          <span className="text-status-success font-data-mono text-data-mono">
            Edge RT-DETR/YOLOv8 Active
          </span>
        </div>
      </div>
    </div>
  );
};
