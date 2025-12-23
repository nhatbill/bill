
import React, { useRef, useState } from 'react';
import { Marker, MarkerType, MARKER_CONFIG, FloorImage } from '../types';

interface Props {
  images: FloorImage[];
  onImagesChange: (images: FloorImage[]) => void;
  selectedTool: MarkerType | null;
  onSelectTool: (type: MarkerType | null) => void;
}

const FloorPlanEditor: React.FC<Props> = ({ images, onImagesChange, selectedTool, onSelectTool }) => {
  const [activeImageId, setActiveImageId] = useState<string | null>(images[0]?.id || null);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImg: FloorImage = {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            markers: []
          };
          const updated = [...images, newImg];
          onImagesChange(updated);
          if (!activeImageId) setActiveImageId(newImg.id);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addMarkerAtPos = (x: number, y: number, type: MarkerType) => {
    if (!activeImageId) return;

    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      type: type,
      x,
      y,
      label: type === MarkerType.NOTE ? 'Nhập ghi chú...' : MARKER_CONFIG[type].label,
      note: ''
    };

    onImagesChange(images.map(img => 
      img.id === activeImageId 
        ? { ...img, markers: [...img.markers, newMarker] } 
        : img
    ));

    // Open editor immediately for new notes
    setEditingMarker(newMarker);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (editingMarker) {
      setEditingMarker(null);
      return;
    }
    if (!selectedTool || !containerRef.current || !activeImageId) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    addMarkerAtPos(x, y, selectedTool);
  };

  const removeMarker = (markerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onImagesChange(images.map(img => ({
      ...img,
      markers: img.markers.filter(m => m.id !== markerId)
    })));
    if (editingMarker?.id === markerId) setEditingMarker(null);
  };

  const updateMarkerLabel = (markerId: string, newLabel: string, newNote: string) => {
    onImagesChange(images.map(img => ({
      ...img,
      markers: img.markers.map(m => m.id === markerId ? { ...m, label: newLabel, note: newNote } : m)
    })));
  };

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = images.filter(img => img.id !== id);
    onImagesChange(updated);
    if (activeImageId === id) setActiveImageId(updated[0]?.id || null);
  };

  const onDragStartToolbox = (e: React.DragEvent, type: MarkerType) => {
    e.dataTransfer.setData('markerType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDragOverContainer = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onMarkerDragStart = (e: React.DragEvent, markerId: string) => {
    e.dataTransfer.setData('existingMarkerId', markerId);
    e.dataTransfer.effectAllowed = 'move';
    // To make the ghost image invisible or smaller if needed, but standard is fine
  };

  const onDropReposition = (e: React.DragEvent) => {
    e.preventDefault();
    const existingId = e.dataTransfer.getData('existingMarkerId');
    const typeFromToolbox = e.dataTransfer.getData('markerType') as MarkerType;

    if (!containerRef.current || !activeImageId) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (typeFromToolbox) {
      addMarkerAtPos(x, y, typeFromToolbox);
      return;
    }

    if (existingId) {
      onImagesChange(images.map(img => 
        img.id === activeImageId 
          ? { ...img, markers: img.markers.map(m => m.id === existingId ? { ...m, x, y } : m) } 
          : img
      ));
    }
  };

  const activeImage = images.find(img => img.id === activeImageId);

  return (
    <div className="space-y-4">
      {/* Toolbox Palette */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest text-center">
          Kéo thả icon hoặc ghi chú vào sơ đồ bên dưới
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(MARKER_CONFIG).map(([type, config]) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStartToolbox(e, type as MarkerType)}
              onClick={() => onSelectTool(selectedTool === type ? null : (type as MarkerType))}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-bold transition-all text-[11px] uppercase tracking-tighter cursor-grab active:cursor-grabbing select-none ${
                selectedTool === type 
                  ? 'border-red-600 bg-red-600 text-white shadow-lg scale-105' 
                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
              }`}
            >
              <span className={type === MarkerType.NOTE ? "font-black text-xs" : "text-sm md:text-base"}>
                {config.icon}
              </span>
              <span className="hidden md:inline">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((img) => (
          <div 
            key={img.id}
            onClick={() => setActiveImageId(img.id)}
            className={`relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
              activeImageId === img.id ? 'border-red-600 scale-105 shadow-md z-10' : 'border-slate-200 opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img.data} className="w-full h-full object-cover" alt="Floor view" />
            <button 
              onClick={(e) => removeImage(img.id, e)}
              className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-bl-lg"
            >✕</button>
          </div>
        ))}
        <label className="w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-red-400 text-slate-400 hover:text-red-400 bg-white transition-colors">
          <span className="text-xl md:text-2xl">+</span>
          <span className="text-[8px] font-bold uppercase">Ảnh/Sơ đồ</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {/* Main Canvas */}
      {activeImage ? (
        <div className="relative border rounded-xl overflow-hidden bg-slate-100 shadow-inner">
          <div 
            ref={containerRef}
            className="relative cursor-crosshair flex justify-center bg-white touch-none"
            onClick={handleContainerClick}
            onDragOver={onDragOverContainer}
            onDrop={onDropReposition}
          >
            <img 
              src={activeImage.data} 
              alt="Floor plan" 
              className="max-w-full h-auto block max-h-[600px] object-contain select-none"
              draggable={false}
            />
            {activeImage.markers.map((marker) => (
              <div key={marker.id}>
                <div
                  draggable
                  onDragStart={(e) => onMarkerDragStart(e, marker.id)}
                  onClick={(e) => { e.stopPropagation(); setEditingMarker(marker); }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-move select-none group/marker transition-all z-20 ${
                    marker.type === MarkerType.NOTE 
                      ? 'bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border-2 border-slate-400 shadow-md text-[10px] font-black text-slate-800'
                      : `w-7 h-7 md:w-10 md:h-10 rounded-full border-2 shadow-lg hover:scale-110 ${MARKER_CONFIG[marker.type].color}`
                  } ${editingMarker?.id === marker.id ? 'ring-4 ring-red-500' : ''}`}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                >
                  {marker.type === MarkerType.NOTE ? (
                    <div className="flex items-center gap-1">
                       <span>{marker.label}</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs md:text-lg">{MARKER_CONFIG[marker.type].icon}</span>
                      {marker.label !== MARKER_CONFIG[marker.type].label && (
                        <div className="absolute top-full mt-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold whitespace-nowrap">
                          {marker.label}
                        </div>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={(e) => removeMarker(marker.id, e)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[8px] md:text-[10px] opacity-100 md:opacity-0 group-marker/marker:opacity-100 transition-opacity"
                  >✕</button>
                </div>

                {/* Edit Panel for Marker */}
                {editingMarker?.id === marker.id && (
                  <div 
                    className="absolute bg-white border-2 border-slate-400 p-3 rounded-2xl shadow-2xl z-40 w-56 animate-in zoom-in duration-200"
                    style={{ left: `${marker.x}%`, top: `calc(${marker.y}% + 35px)`, transform: 'translateX(-50%)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase text-slate-400">
                        {marker.type === MarkerType.NOTE ? 'Nội dung văn bản' : 'Chỉnh sửa định danh'}
                      </span>
                      <button onClick={() => setEditingMarker(null)} className="text-slate-300 hover:text-slate-600">✕</button>
                    </div>
                    <input 
                      type="text"
                      className="w-full text-xs font-bold border-slate-200 rounded-lg p-2 mb-2 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                      placeholder={marker.type === MarkerType.NOTE ? "Nhập nội dung cần hiển thị..." : "Ví dụ: Phòng ngủ 1, Cửa sau..."}
                      value={marker.label}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') setEditingMarker(null); }}
                      onChange={(e) => updateMarkerLabel(marker.id, e.target.value, marker.note || '')}
                    />
                    {marker.type !== MarkerType.NOTE && (
                      <textarea 
                        className="w-full text-[10px] border-slate-200 rounded-lg p-2 mb-2 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                        placeholder="Ghi chú thêm (không hiện trên ảnh)..."
                        value={marker.note}
                        onChange={(e) => updateMarkerLabel(marker.id, marker.label, e.target.value)}
                      />
                    )}
                    <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingMarker(null)}
                          className="flex-1 bg-slate-900 text-white py-1.5 rounded-lg text-[9px] font-black uppercase"
                        >
                          Xong
                        </button>
                        <button 
                          onClick={(e) => removeMarker(marker.id, e)}
                          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-red-100"
                        >
                          Xóa
                        </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="bg-slate-50 px-4 py-2 text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center border-t">
            Hướng dẫn: Kéo thả các icon để thay đổi vị trí trực tiếp trên ảnh
          </div>
        </div>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center bg-slate-50 border border-dashed rounded-xl text-slate-400 text-sm p-6 text-center">
          <div className="text-3xl mb-2 opacity-20">📸</div>
          Tải sơ đồ hoặc ảnh hiện trạng lên để bắt đầu.
        </div>
      )}
    </div>
  );
};

export default FloorPlanEditor;
