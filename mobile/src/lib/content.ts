export type BagItem = {
  id: string;
  label: string;
  category: string;
  checked?: boolean;
};

export const BAG_DEFAULT_ITEMS: BagItem[] = [
  { id: 'water', label: 'Su (3 günlük)', category: 'Temel' },
  { id: 'food', label: 'Bozulmayan gıda', category: 'Temel' },
  { id: 'first_aid', label: 'İlk yardım çantası', category: 'Sağlık' },
  { id: 'meds', label: 'Kişisel ilaçlar', category: 'Sağlık' },
  { id: 'docs', label: 'Önemli belge kopyaları', category: 'Belgeler' },
  { id: 'flashlight', label: 'El feneri + yedek pil', category: 'Ekipman' },
  { id: 'whistle', label: 'Düdük', category: 'Ekipman' },
  { id: 'cash', label: 'Nakit (küçük banknot)', category: 'Belgeler' },
];

export const STATUS_ORDER = ['todo', 'in-progress', 'done'] as const;

export type PrepTask = {
  id: string;
  title: string;
  titleEn: string;
};

// Curated earthquake prep tasks. Titles must stay identical to the web
// catalog (frontend/src/content/prep-tasks.js) so tasks match across
// platforms by title.
export const PREP_TASKS: PrepTask[] = [
  { id: 'plan', title: 'Aile afet planı oluştur', titleEn: 'Create a family disaster plan' },
  {
    id: 'meeting_point',
    title: 'Deprem sonrası toplanma noktası belirle',
    titleEn: 'Pick a post-quake assembly point',
  },
  { id: 'bag_ready', title: 'Acil durum çantasını hazırla', titleEn: 'Prepare the emergency bag' },
  {
    id: 'furniture',
    title: 'Mobilya ve beyaz eşyaları duvara sabitle',
    titleEn: 'Secure furniture and appliances to walls',
  },
  {
    id: 'building_check',
    title: 'Binanın deprem risk durumunu öğren',
    titleEn: "Learn your building's earthquake risk status",
  },
  { id: 'docs_backup', title: 'Önemli belgeleri yedekle', titleEn: 'Back up important documents' },
  {
    id: 'first_aid_course',
    title: 'Temel ilk yardım eğitimi al',
    titleEn: 'Take a basic first aid course',
  },
  {
    id: 'valves',
    title: 'Gaz, su ve elektrik vanalarının yerini öğren',
    titleEn: 'Locate gas, water and electricity shutoffs',
  },
  {
    id: 'emergency_numbers',
    title: 'AFAD ve acil durum numaralarını kaydet',
    titleEn: 'Save AFAD and emergency numbers',
  },
  {
    id: 'dask',
    title: 'Zorunlu deprem sigortası (DASK) yaptır',
    titleEn: 'Get mandatory earthquake insurance (DASK)',
  },
];
