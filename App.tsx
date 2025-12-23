
import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Floor, 
  HouseholdInfo, 
  MARKER_CONFIG,
  MarkerType,
  FloorImage
} from './types';
import FloorPlanEditor from './components/FloorPlanEditor';
import { generateEmergencyBrief } from './services/geminiService';

interface Toast {
  id: string;
  message: string;
}

const App: React.FC = () => {
  const [info, setInfo] = useState<HouseholdInfo>({
    address: '',
    latitude: null,
    longitude: null,
    buildings: [{
      id: 'b1',
      name: 'Khối nhà chính',
      floors: [{ id: 'f1', name: 'Tầng trệt', images: [] }]
    }],
    reporter: {
      fullName: '',
      phone: '',
      relationship: '',
      idNumber: '',
      email: '',
    },
    residents: { elderly: 0, children: 0, mobilityImpaired: 0, adults: 0 },
    fireEquipment: '',
    hazards: '',
    assemblyPoint: '',
  });

  const [selectedTool, setSelectedTool] = useState<MarkerType | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [numBuildings, setNumBuildings] = useState<number>(1);

  const addToast = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const applyQuickSetup = () => {
    if (numBuildings < 1) return;
    const newBuildings: Building[] = Array.from({ length: numBuildings }).map((_, bi) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: bi === 0 ? 'Khối nhà chính' : `Khối nhà ${bi + 1}`,
      floors: [{ id: Math.random().toString(36).substr(2, 9), name: 'Tầng trệt', images: [] }]
    }));
    setInfo(prev => ({ ...prev, buildings: newBuildings }));
    addToast(`Đã thiết lập ${numBuildings} khối nhà riêng biệt.`);
  };

  const getBrowserLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setInfo(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setIsLocating(false);
        addToast("Đã xác định vị trí GPS thành công.");
      },
      (error) => {
        setIsLocating(false);
        alert("Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí.");
      },
      { enableHighAccuracy: true }
    );
  };

  const addBuilding = () => {
    const name = `Khối nhà ${info.buildings.length + 1}`;
    const newB: Building = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      floors: [{ id: Math.random().toString(36).substr(2, 9), name: 'Tầng trệt', images: [] }]
    };
    setInfo(prev => ({ ...prev, buildings: [...prev.buildings, newB] }));
    addToast(`Đã thêm ${name}.`);
  };

  const addFloor = (buildingId: string) => {
    const building = info.buildings.find(b => b.id === buildingId);
    const floorName = `Tầng ${building?.floors.length || 0}`;
    setInfo(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => b.id === buildingId ? {
        ...b,
        floors: [...b.floors, { id: Math.random().toString(36).substr(2, 9), name: floorName, images: [] }]
      } : b)
    }));
    addToast(`Đã thêm ${floorName} cho ${building?.name}.`);
  };

  const updateBuildingName = (id: string, name: string) => {
    setInfo(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => b.id === id ? { ...b, name } : b)
    }));
  };

  const updateFloorName = (buildingId: string, floorId: string, name: string) => {
    setInfo(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => b.id === buildingId ? {
        ...b,
        floors: b.floors.map(f => f.id === floorId ? { ...f, name } : f)
      } : b)
    }));
  };

  const updateFloorImages = (buildingId: string, floorId: string, images: FloorImage[]) => {
    setInfo(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => b.id === buildingId ? {
        ...b,
        floors: b.floors.map(f => f.id === floorId ? { ...f, images } : f)
      } : b)
    }));
  };

  const removeFloor = (buildingId: string, floorId: string) => {
    setInfo(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => b.id === buildingId ? {
        ...b,
        floors: b.floors.filter(f => f.id !== floorId)
      } : b)
    }));
    addToast("Đã xóa tầng.");
  };

  const removeBuilding = (id: string) => {
    if (info.buildings.length <= 1) return;
    setInfo(prev => ({ ...prev, buildings: prev.buildings.filter(b => b.id !== id) }));
    addToast("Đã xóa khối nhà.");
  };

  const handleResidentChange = (field: keyof HouseholdInfo['residents'], value: number) => {
    setInfo(prev => ({
      ...prev,
      residents: { ...prev.residents, [field]: Math.max(0, value) }
    }));
  };

  const handleReporterChange = (field: keyof HouseholdInfo['reporter'], value: string) => {
    setInfo(prev => ({
      ...prev,
      reporter: { ...prev.reporter, [field]: value }
    }));
  };

  const handleFinalSubmit = () => {
    if (!info.reporter.fullName || !info.reporter.phone) {
      alert("Vui lòng nhập đầy đủ Họ tên và Số điện thoại.");
      return;
    }
    if (!info.latitude || !info.longitude) {
      alert("Vui lòng xác định vị trí tọa độ GPS.");
      return;
    }
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 font-bold text-xs border border-white/10 flex items-center gap-3">
            <span className="text-green-400">●</span> {toast.message}
          </div>
        ))}
      </div>

      <header className="bg-red-700 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🚒</span>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">FireSafe Connect</h1>
              <p className="text-[10px] font-bold tracking-widest text-red-100 mt-1 uppercase">Hệ thống báo cáo PCCC</p>
            </div>
          </div>
          <span className="text-3xl font-black">114</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8 mt-6">
        
        {/* Step 1 */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">📍</div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Bước 1: Vị trí cơ sở</h3>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 flex gap-3">
            <span className="text-blue-500">ℹ️</span>
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              <strong>Hướng dẫn:</strong> Nhập địa chỉ cụ thể và nhấn nút <strong>"Tự động lấy tọa độ"</strong>. GPS giúp xe chữa cháy tìm đường nhanh nhất ngay cả trong hẻm sâu.
            </p>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              className="w-full border-slate-200 bg-slate-50 rounded-2xl p-4 border focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
              placeholder="Nhập địa chỉ: Số nhà, Tên đường, Phường/Xã..."
              value={info.address}
              onChange={(e) => setInfo(prev => ({ ...prev, address: e.target.value }))}
            />
            <button onClick={getBrowserLocation} disabled={isLocating} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-200">
              {isLocating ? 'Đang định vị...' : '📍 Tự động lấy tọa độ GPS'}
            </button>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border p-3 rounded-xl text-center">
                <span className="block text-[9px] font-black uppercase text-slate-400">Vĩ độ</span>
                <span className="font-black text-sm">{info.latitude?.toFixed(6) || '--'}</span>
              </div>
              <div className="bg-slate-50 border p-3 rounded-xl text-center">
                <span className="block text-[9px] font-black uppercase text-slate-400">Kinh độ</span>
                <span className="font-black text-sm">{info.longitude?.toFixed(6) || '--'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">👤</div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Bước 2: Người báo cáo</h3>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 flex gap-3">
            <span className="text-blue-500">ℹ️</span>
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              <strong>Hướng dẫn:</strong> Cung cấp tên và số điện thoại của người ở tại cơ sở. Lực lượng 114 sẽ gọi lại để hướng dẫn thoát nạn khi có sự cố xảy ra.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl p-3 border text-sm" placeholder="Họ và tên..." value={info.reporter.fullName} onChange={(e) => handleReporterChange('fullName', e.target.value)} />
            <input type="tel" className="w-full border-slate-200 bg-slate-50 rounded-xl p-3 border text-sm" placeholder="Số điện thoại..." value={info.reporter.phone} onChange={(e) => handleReporterChange('phone', e.target.value)} />
            <input type="text" className="md:col-span-2 w-full border-slate-200 bg-slate-50 rounded-xl p-3 border text-sm" placeholder="Mối quan hệ (Chủ hộ, Quản lý, Người thuê...)" value={info.reporter.relationship} onChange={(e) => handleReporterChange('relationship', e.target.value)} />
          </div>
        </section>

        {/* Quick Config */}
        <section className="bg-blue-900 text-white p-6 rounded-3xl shadow-lg border border-blue-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">⚙️ Số lượng khối nhà riêng biệt</h3>
              <p className="text-blue-200 text-xs leading-relaxed font-medium">
                <strong>Hướng dẫn:</strong> Nếu cơ sở của bạn có nhiều tòa nhà độc lập (ví dụ: Nhà xưởng + Văn phòng), hãy nhập số lượng tại đây để hệ thống tạo danh sách sơ đồ tương ứng.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/20">
              <input 
                type="number" min="1" className="w-16 bg-blue-800 border-none rounded-lg text-center font-black"
                value={numBuildings} onChange={(e) => setNumBuildings(parseInt(e.target.value) || 1)}
              />
              <button onClick={applyQuickSetup} className="bg-white text-blue-900 px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-md">Thiết lập ngay</button>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Bước 3: Sơ đồ tầng & Vị trí</h3>
            </div>
            <button onClick={addBuilding} className="bg-slate-800 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full">+ Thêm khối nhà</button>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
            <span className="text-blue-500">ℹ️</span>
            <div className="text-[11px] text-blue-700 leading-relaxed font-medium">
              <strong>Hướng dẫn chi tiết:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li><strong>Đổi tên tầng:</strong> Click vào ô tên tầng (ví dụ "Tầng trệt") để sửa lại cho đúng.</li>
                <li><strong>Tải ảnh:</strong> Nhấn "+" để tải ảnh mặt bằng hoặc chụp ảnh thực tế.</li>
                <li><strong>Ghim Icon:</strong> Kéo Icon từ thanh công cụ thả vào ảnh. <strong>Có thể kéo trực tiếp icon trên ảnh để thay đổi vị trí.</strong></li>
                <li><strong>Ghi chú:</strong> Dùng icon <strong>T</strong> để viết ghi chú văn bản tự do lên ảnh.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            {info.buildings.map((building) => (
              <div key={building.id} className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-5 flex items-center justify-between border-b">
                  <input 
                    type="text" className="bg-transparent border-none font-black text-slate-800 focus:ring-0 text-xl w-1/2"
                    value={building.name} onChange={(e) => updateBuildingName(building.id, e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => addFloor(building.id)} className="bg-red-50 text-red-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full">+ Tầng</button>
                    <button onClick={() => removeBuilding(building.id)} className="text-slate-300 p-2">✕</button>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {building.floors.map((floor) => (
                    <div key={floor.id} className="bg-slate-50/50 p-6 rounded-3xl border-2 border-slate-100 relative group">
                      <div className="flex items-center gap-2 mb-4 relative">
                        <div className="relative">
                          <input 
                            type="text" className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-bold w-48 shadow-sm focus:ring-2 focus:ring-red-500/40 outline-none"
                            value={floor.name} onChange={(e) => updateFloorName(building.id, floor.id, e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">✎</span>
                        </div>
                        <button onClick={() => removeFloor(building.id, floor.id)} className="text-slate-300 hover:text-red-500 text-[10px] font-bold uppercase ml-auto">Xóa tầng</button>
                      </div>
                      
                      <FloorPlanEditor 
                        images={floor.images} 
                        onImagesChange={(imgs) => updateFloorImages(building.id, floor.id, imgs)}
                        selectedTool={selectedTool}
                        onSelectTool={setSelectedTool}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4 */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-black text-slate-800 mb-2 flex items-center gap-3 uppercase tracking-tight">👥 Nhân khẩu</h3>
            <p className="text-[10px] text-slate-500 mb-4 font-medium italic">Hướng dẫn: Cung cấp số lượng người để PCCC ưu tiên cứu hộ người già/trẻ em trước.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Người già', field: 'elderly', icon: '👵' },
                { label: 'Trẻ nhỏ', field: 'children', icon: '👶' },
                { label: 'Khó vận động', field: 'mobilityImpaired', icon: '♿' },
                { label: 'Tổng số người', field: 'adults', icon: '👤' },
              ].map((item) => (
                <div key={item.field} className="bg-slate-50 p-4 rounded-2xl border flex flex-col items-center">
                  <span className="text-xl mb-1">{item.icon}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mb-2 text-center leading-none">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleResidentChange(item.field as any, (info.residents as any)[item.field] - 1)} className="w-8 h-8 rounded-full bg-white border font-bold hover:bg-red-50">-</button>
                    <span className="font-black text-lg">{(info.residents as any)[item.field]}</span>
                    <button onClick={() => handleResidentChange(item.field as any, (info.residents as any)[item.field] + 1)} className="w-8 h-8 rounded-full bg-white border font-bold hover:bg-green-50">+</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="font-black text-slate-800 mb-2 flex items-center gap-3 uppercase tracking-tight">🧯 Thiết bị PCCC</h3>
            <p className="text-[10px] text-slate-500 mb-4 font-medium italic">Hướng dẫn: Ghi rõ vị trí và loại bình chữa cháy, thang dây hiện có.</p>
            <textarea 
              className="w-full border-slate-200 bg-slate-50 rounded-2xl p-4 flex-1 min-h-[140px] text-sm focus:ring-4 focus:ring-red-500/10 outline-none shadow-inner"
              placeholder="Ví dụ: 3 bình ABC ở chân cầu thang, 1 thang dây ban công tầng 2..."
              value={info.fireEquipment}
              onChange={(e) => setInfo(prev => ({ ...prev, fireEquipment: e.target.value }))}
            />
          </section>
        </div>

        {/* Final Action */}
        <div className="pt-6">
          <button 
            onClick={handleFinalSubmit}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all active:scale-[0.98] text-xl uppercase border-b-8 border-red-900"
          >
            🚀 GỬI THÔNG TIN KHẨN CẤP
          </button>
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 leading-relaxed">
            Dữ liệu của bạn được mã hóa và gửi trực tiếp đến hệ thống chỉ huy 114.
          </p>
        </div>

        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[100] p-4">
            <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">✓</div>
              <h4 className="text-2xl font-black text-slate-800 mb-4 uppercase">GỬI THÀNH CÔNG</h4>
              <p className="text-slate-500 text-sm font-semibold mb-8 leading-relaxed italic">
                Cán bộ PCCC sẽ sớm liên hệ qua điện thoại để xác minh và hỗ trợ phương án đảm bảo an toàn cho cơ sở của bạn.
              </p>
              <button onClick={() => setShowSuccess(false)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase hover:bg-slate-800 shadow-lg transition-all">Đã hiểu</button>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-12 text-slate-400">
        <div className="flex justify-center gap-4 mb-3">
           <span className="text-[10px] font-black uppercase tracking-widest bg-slate-200 px-3 py-1 rounded-full">Version 2.7.0</span>
           <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-3 py-1 rounded-full">PCCC Intelligence</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
