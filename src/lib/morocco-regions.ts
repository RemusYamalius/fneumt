// Morocco's 12 regions mapped to academies with simplified SVG paths
// Each region has approximate polygon coordinates for SVG rendering

export interface RegionData {
  id: string;
  nameAr: string;
  nameFr: string;
  academyLabel: string;
  // SVG path data (simplified polygon for the region)
  path: string;
  // Center point for labels
  center: [number, number];
}

// These are simplified polygon paths in a normalized coordinate system (0-500 x 0-700)
// representing Morocco's 12 administrative regions
export const MOROCCO_REGIONS: RegionData[] = [
  {
    id: 'tanger-tetouan',
    nameAr: 'طنجة – تطوان – الحسيمة',
    nameFr: 'Tanger-Tétouan-Al Hoceïma',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة طنجة – تطوان – الحسيمة',
    path: 'M 175 15 L 230 10 L 270 20 L 290 45 L 280 75 L 260 90 L 235 95 L 210 105 L 185 95 L 165 75 L 155 50 Z',
    center: [220, 55],
  },
  {
    id: 'oriental',
    nameAr: 'الشرق',
    nameFr: 'Oriental',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة الشرق',
    path: 'M 290 45 L 340 20 L 400 30 L 420 60 L 415 110 L 400 160 L 370 190 L 330 195 L 300 170 L 280 135 L 260 100 L 260 90 L 280 75 Z',
    center: [340, 110],
  },
  {
    id: 'fes-meknes',
    nameAr: 'فاس – مكناس',
    nameFr: 'Fès-Meknès',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة فاس – مكناس',
    path: 'M 210 105 L 235 95 L 260 100 L 280 135 L 300 170 L 310 200 L 290 225 L 260 235 L 230 225 L 210 200 L 195 170 L 185 135 Z',
    center: [250, 165],
  },
  {
    id: 'rabat-sale',
    nameAr: 'الرباط – سلا – القنيطرة',
    nameFr: 'Rabat-Salé-Kénitra',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة الرباط – سلا – القنيطرة',
    path: 'M 145 100 L 185 95 L 210 105 L 185 135 L 195 170 L 180 200 L 160 210 L 140 195 L 130 165 L 125 135 Z',
    center: [162, 155],
  },
  {
    id: 'beni-mellal',
    nameAr: 'بني ملال – خنيفرة',
    nameFr: 'Béni Mellal-Khénifra',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة بني ملال – خنيفرة',
    path: 'M 195 170 L 210 200 L 230 225 L 260 235 L 290 225 L 310 200 L 330 195 L 345 225 L 330 265 L 290 280 L 255 275 L 225 265 L 200 250 L 180 225 L 180 200 Z',
    center: [260, 235],
  },
  {
    id: 'casablanca-settat',
    nameAr: 'الدار البيضاء – سطات',
    nameFr: 'Casablanca-Settat',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة الدار البيضاء – سطات',
    path: 'M 125 195 L 140 195 L 160 210 L 180 225 L 200 250 L 190 275 L 165 285 L 140 275 L 120 255 L 110 225 Z',
    center: [155, 245],
  },
  {
    id: 'marrakech-safi',
    nameAr: 'مراكش – آسفي',
    nameFr: 'Marrakech-Safi',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة مراكش – آسفي',
    path: 'M 110 255 L 140 275 L 165 285 L 190 275 L 225 265 L 255 275 L 260 310 L 240 340 L 210 350 L 175 345 L 145 330 L 120 310 L 105 285 Z',
    center: [185, 310],
  },
  {
    id: 'draa-tafilalet',
    nameAr: 'درعة – تافيلالت',
    nameFr: 'Drâa-Tafilalet',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة درعة – تافيلالت',
    path: 'M 255 275 L 290 280 L 330 265 L 370 280 L 400 310 L 390 360 L 360 390 L 320 400 L 280 390 L 255 365 L 240 340 L 260 310 Z',
    center: [320, 335],
  },
  {
    id: 'souss-massa',
    nameAr: 'سوس – ماسة',
    nameFr: 'Souss-Massa',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة سوس – ماسة',
    path: 'M 105 330 L 145 330 L 175 345 L 210 350 L 240 340 L 255 365 L 240 400 L 210 420 L 175 425 L 140 415 L 110 395 L 95 365 Z',
    center: [175, 380],
  },
  {
    id: 'guelmim',
    nameAr: 'كلميم – واد نون',
    nameFr: 'Guelmim-Oued Noun',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة كلميم – واد نون',
    path: 'M 85 395 L 110 395 L 140 415 L 175 425 L 195 445 L 180 480 L 150 500 L 115 495 L 85 475 L 70 445 Z',
    center: [135, 455],
  },
  {
    id: 'laayoune',
    nameAr: 'العيون – الساقية الحمراء',
    nameFr: 'Laâyoune-Sakia El Hamra',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة العيون – الساقية الحمراء',
    path: 'M 60 475 L 85 475 L 115 495 L 150 500 L 170 520 L 160 560 L 140 590 L 110 600 L 75 590 L 50 560 L 45 520 Z',
    center: [110, 540],
  },
  {
    id: 'dakhla',
    nameAr: 'الداخلة – وادي الذهب',
    nameFr: 'Dakhla-Oued Ed-Dahab',
    academyLabel: 'الأكاديمية الجهوية للتربية والتكوين لجهة الداخلة – وادي الذهب',
    path: 'M 40 590 L 75 590 L 110 600 L 140 590 L 155 620 L 145 660 L 125 685 L 95 695 L 65 685 L 40 660 L 30 630 Z',
    center: [95, 645],
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
