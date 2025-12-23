
import { GoogleGenAI } from "@google/genai";
import { HouseholdInfo, MARKER_CONFIG, Building, Floor, FloorImage } from "../types";

export const generateEmergencyBrief = async (info: HouseholdInfo): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const structureSummary = info.buildings.map(b => {
    const floorInfo = b.floors.map(f => {
      const markers = f.images.flatMap(img => 
        img.markers.map(m => `${MARKER_CONFIG[m.type].label}${m.label !== MARKER_CONFIG[m.type].label ? ' (' + m.label + ')' : ''}`)
      ).join(', ');
      return `  - ${f.name}: ${markers || 'Không có đánh dấu'}`;
    }).join('\n');
    return `- Khối nhà: ${b.name}\n${floorInfo}`;
  }).join('\n\n');

  const prompt = `
    Dựa trên thông tin cơ sở đa cấu trúc sau, hãy tạo một bản tóm tắt chỉ thị cứu hộ khẩn cấp cho lực lượng PCCC (114).
    
    THÔNG TIN CƠ BẢN:
    - NGƯỜI BÁO CÁO: ${info.reporter.fullName} (${info.reporter.relationship})
    - ĐIỆN THOẠI: ${info.reporter.phone}
    - ĐỊA CHỈ: ${info.address}
    - TỌA ĐỘ GPS: Latitude ${info.latitude}, Longitude ${info.longitude}
    
    NHÂN KHẨU (ƯU TIÊN CỨU HỘ):
    - Người già: ${info.residents.elderly}, Trẻ nhỏ: ${info.residents.children}, Khó vận động: ${info.residents.mobilityImpaired}
    
    CẤU TRÚC & VỊ TRÍ CHI TIẾT (DỰA TRÊN SƠ ĐỒ):
    ${structureSummary}
    
    CẢNH BÁO NGUY HIỂM & TRANG THIẾT BỊ:
    - Thiết bị PCCC tại chỗ: ${info.fireEquipment || 'Không rõ'}
    - Khu vực nguy hiểm cháy nổ: ${info.hazards || 'Theo đánh dấu trên sơ đồ'}
    - Điểm tập kết an toàn: ${info.assemblyPoint}
    
    Yêu cầu: 
    1. Trình bày cực kỳ súc tích theo dạng gạch đầu dòng lệnh.
    2. Nêu rõ ưu tiên cứu hộ người già/trẻ em tại tầng nào.
    3. Cảnh báo các khu vực "Nguy hiểm cháy nổ" cụ thể dựa trên thông tin cung cấp.
    4. Ngôn ngữ: Tiếng Việt, chuyên nghiệp, khẩn cấp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Không thể tạo bản tóm tắt chỉ thị.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lỗi phân tích dữ liệu AI.";
  }
};
