// ================= Types =================
export type EventItem = {
  id: string;
  title: string;
  cover?: string;
  about: string;
  tags: string[];
  location?: string;
  date?: string;
  popularity?: number;
};

export type GroupItem = {
  id: string;
  eventId: string;
  name: string;
  members: number;
  max?: number;
  description?: string;
};

export type DemoUser = {
  uid: string;
  name: string;
  avatar: string;
};

// ================= Tags =================
export const ALL_TAGS = [
  '#คอนเสิร์ต', '#ติวสอบ', '#บอร์ดเกม', '#ฟิตเนส',
  '#วิ่ง', '#ปีนเขา', '#ถ่ายรูป', '#กาแฟ', '#เที่ยว',
];

// ================= Events =================
export const DEMO_EVENTS: EventItem[] = [
  {
    id: 'ev-concert-a',
    title: 'Concert Night – A Artist',
    about: 'ไปดูคอนเสิร์ตด้วยกัน สนุก ปลอดภัย มีเพื่อนคอยช่วยเหลือ',
    cover: 'https://i.pinimg.com/736x/0b/65/4b/0b654bef1d22ab21666d278a4029b3fb.jpg',
    tags: ['#คอนเสิร์ต', '#เที่ยว'],
    location: 'Impact Arena',
    date: '2025-10-01T19:00:00Z',
    popularity: 98,
  },
  {
    id: 'ev-boardgame',
    title: 'Boardgame Meetup – Chill & Play',
    about: 'สายบอร์ดเกมมารวมกัน แจกไอเดียเกมใหม่ๆ เพียบ',
    cover: 'https://images.unsplash.com/photo-1523875194681-bedd468c58bf?q=80&w=1600&auto=format&fit=crop',
    tags: ['#บอร์ดเกม', '#กาแฟ'],
    location: 'WeGo Space',
    date: '2025-09-25T12:00:00Z',
    popularity: 86,
  },
  {
    id: 'ev-toeic',
    title: 'TOEIC Study Group – 700+',
    about: 'ติวสอบ TOEIC กันแบบเข้มข้น แชร์เทคนิค + ข้อสอบจริง',
    cover: 'https://i.pinimg.com/1200x/69/93/9a/69939a8692c11efb6aab841a4391d16b.jpg',
    tags: ['#ติวสอบ'],
    location: 'BKK Library',
    date: '2025-09-28T03:00:00Z',
    popularity: 92,
  },
  {
    id: 'ev-run',
    title: 'Sunday Run – Lumpini Park',
    about: 'นัดวิ่งเช้า ๆ สุขภาพดี มีเพื่อนไปด้วยไม่เหงา',
    cover: 'https://i.pinimg.com/736x/db/b7/28/dbb728791085bb195b5d0da7f56ed383.jpg',
    tags: ['#วิ่ง', '#ฟิตเนส'],
    location: 'Lumpini Park',
    date: '2025-09-21T23:00:00Z',
    popularity: 74,
  },
];

// ================= Groups =================
export const DEMO_GROUPS: GroupItem[] = [
  { id: 'g-con-1', eventId: 'ev-concert-a', name: 'โซนหน้าสุดสายมันส์', members: 18, max: 24 },
  { id: 'g-con-2', eventId: 'ev-concert-a', name: 'โซนไวบ์ชิล', members: 12, max: 18 },
  { id: 'g-bd-1', eventId: 'ev-boardgame', name: 'เริ่มต้น / เกมง่าย', members: 8, max: 10 },
  { id: 'g-bd-2', eventId: 'ev-boardgame', name: 'เกมยาว / กลยุทธ์หนัก', members: 7, max: 8 },
  { id: 'g-toeic-1', eventId: 'ev-toeic', name: '700+ intensive', members: 15, max: 20 },
  { id: 'g-run-1', eventId: 'ev-run', name: '5K easy pace', members: 9, max: 12 },
];

// ================= Users =================
export const DEMO_USERS: DemoUser[] = [
  { uid: 'me', name: 'Me (You)', avatar: 'https://i.pravatar.cc/100?img=15' },
  { uid: 'u1', name: 'Beam', avatar: 'https://i.pravatar.cc/100?img=12' },
  { uid: 'u2', name: 'Ploy', avatar: 'https://i.pravatar.cc/100?img=32' },
  { uid: 'u3', name: 'Mek',  avatar: 'https://i.pravatar.cc/100?img=47' },
];

// ================= Members in Groups =================
export const DEMO_MEMBERS: Record<string, DemoUser[]> = {
  'g-con-1': [DEMO_USERS[0], DEMO_USERS[1], DEMO_USERS[2]],
  'g-con-2': [DEMO_USERS[0], DEMO_USERS[3]],
  'g-bd-1':  [DEMO_USERS[0], DEMO_USERS[2]],
  'g-bd-2':  [DEMO_USERS[0], DEMO_USERS[1], DEMO_USERS[3]],
  'g-toeic-1':[DEMO_USERS[0], DEMO_USERS[1]],
  'g-run-1':  [DEMO_USERS[0], DEMO_USERS[2], DEMO_USERS[3]],
};

// ================= Join State =================
export const DEMO_JOINED = new Set<string>();

// ================= Helpers =================
export function getDefaultGroupIdByEvent(eventId: string): string | null {
  const g = DEMO_GROUPS.find((x) => x.eventId === eventId);
  return g ? g.id : null;
}

// =============== Join group ===============
export function joinGroup(groupId: string) {
  DEMO_JOINED.add(groupId);
  console.log(`Joined group: ${groupId}`);
}

