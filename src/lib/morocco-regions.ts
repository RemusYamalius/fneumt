// Mapping between GeoJSON region names and system academy labels

export interface RegionMapping {
  geoId: string;       // ID from GeoJSON (e.g. "MA01")
  nameAr: string;
  nameFr: string;
  academyLabel: string; // Must match profiles.academy values
}

// Maps GeoJSON region id → system academy label
export const REGION_MAPPINGS: RegionMapping[] = [
  {
    geoId: 'MA01',
    nameAr: 'طنجة – تطوان – الحسيمة',
    nameFr: 'Tanger-Tétouan-Al Hoceïma',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة طنجة – تطوان – الحسيمة',
  },
  {
    geoId: 'MA02',
    nameAr: 'الشرق',
    nameFr: 'Oriental',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة الشرق',
  },
  {
    geoId: 'MA03',
    nameAr: 'فاس – مكناس',
    nameFr: 'Fès-Meknès',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة فاس – مكناس',
  },
  {
    geoId: 'MA04',
    nameAr: 'الرباط – سلا – القنيطرة',
    nameFr: 'Rabat-Salé-Kénitra',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة الرباط – سلا – القنيطرة',
  },
  {
    geoId: 'MA05',
    nameAr: 'بني ملال – خنيفرة',
    nameFr: 'Béni Mellal-Khénifra',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة بني ملال – خنيفرة',
  },
  {
    geoId: 'MA06',
    nameAr: 'الدار البيضاء – سطات',
    nameFr: 'Casablanca-Settat',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة الدار البيضاء – سطات',
  },
  {
    geoId: 'MA07',
    nameAr: 'مراكش – آسفي',
    nameFr: 'Marrakech-Safi',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة مراكش – آسفي',
  },
  {
    geoId: 'MA08',
    nameAr: 'درعة – تافيلالت',
    nameFr: 'Drâa-Tafilalet',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة درعة – تافيلالت',
  },
  {
    geoId: 'MA09',
    nameAr: 'سوس – ماسة',
    nameFr: 'Souss-Massa',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة سوس – ماسة',
  },
  {
    geoId: 'MA10',
    nameAr: 'كلميم – واد نون',
    nameFr: 'Guelmim-Oued Noun',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة كلميم – واد نون',
  },
  {
    geoId: 'MA11',
    nameAr: 'العيون – الساقية الحمراء',
    nameFr: 'Laâyoune-Sakia El Hamra',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة العيون – الساقية الحمراء',
  },
  {
    geoId: 'MA12',
    nameAr: 'الداخلة – وادي الذهب',
    nameFr: 'Dakhla-Oued Ed-Dahab',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة الداخلة – وادي الذهب',
  },
];

// Color palette for regions (royal blue shades)
export const REGION_COLORS = [
  'hsl(225, 70%, 45%)',
  'hsl(225, 65%, 50%)',
  'hsl(220, 70%, 42%)',
  'hsl(230, 65%, 48%)',
  'hsl(225, 60%, 52%)',
  'hsl(220, 75%, 40%)',
  'hsl(228, 68%, 46%)',
  'hsl(222, 72%, 44%)',
  'hsl(226, 62%, 50%)',
  'hsl(218, 70%, 43%)',
  'hsl(232, 65%, 47%)',
  'hsl(224, 68%, 42%)',
];

// Helper to find mapping by GeoJSON feature id
export function getRegionMapping(geoId: string): RegionMapping | undefined {
  return REGION_MAPPINGS.find(r => r.geoId === geoId);
}
