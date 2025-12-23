
export enum MarkerType {
  ELDERLY = 'ELDERLY',
  CHILD = 'CHILD',
  MOBILITY_AID = 'MOBILITY_AID',
  HAZARD = 'HAZARD',
  FIRE_EXTINGUISHER = 'FIRE_EXTINGUISHER',
  PET = 'PET',
  EXIT = 'EXIT',
  NOTE = 'NOTE'
}

export interface Marker {
  id: string;
  type: MarkerType;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  note?: string;
}

export interface FloorImage {
  id: string;
  data: string; // base64
  markers: Marker[];
}

export interface Floor {
  id: string;
  name: string;
  images: FloorImage[];
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
}

export interface ReporterInfo {
  fullName: string;
  phone: string;
  relationship: string;
  idNumber: string;
  email: string;
}

export interface HouseholdInfo {
  address: string;
  latitude: number | null;
  longitude: number | null;
  buildings: Building[];
  reporter: ReporterInfo;
  residents: {
    elderly: number;
    children: number;
    mobilityImpaired: number;
    adults: number;
  };
  fireEquipment: string;
  hazards: string;
  assemblyPoint: string;
}

export const MARKER_CONFIG = {
  [MarkerType.ELDERLY]: { icon: '👵', label: 'Người già', color: 'bg-amber-100 text-amber-600 border-amber-300' },
  [MarkerType.CHILD]: { icon: '👶', label: 'Trẻ nhỏ', color: 'bg-blue-100 text-blue-600 border-blue-300' },
  [MarkerType.MOBILITY_AID]: { icon: '♿', label: 'Hỗ trợ vận động', color: 'bg-purple-100 text-purple-600 border-purple-300' },
  [MarkerType.HAZARD]: { icon: '🔥', label: 'Nguy hiểm cháy nổ', color: 'bg-red-100 text-red-600 border-red-300' },
  [MarkerType.FIRE_EXTINGUISHER]: { icon: '🧯', label: 'Dụng cụ chữa cháy', color: 'bg-green-100 text-green-600 border-green-300' },
  [MarkerType.PET]: { icon: '🐶', label: 'Thú cưng', color: 'bg-orange-100 text-orange-600 border-orange-300' },
  [MarkerType.EXIT]: { icon: '🚪', label: 'Lối thoát hiểm', color: 'bg-emerald-100 text-emerald-600 border-emerald-300' },
  [MarkerType.NOTE]: { icon: 'T', label: 'Văn bản / Ghi chú', color: 'bg-white text-slate-800 border-slate-400' },
};
