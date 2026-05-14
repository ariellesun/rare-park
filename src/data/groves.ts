/**
 * 拾珍园 · 罕见病林地数据
 *
 * 10 个病种，每个对应一个生态群落（grove）。
 * v4：颜色饱和度大幅提升，每个 grove 增加 description（用于 hover 信息卡）。
 */

export type PlantKind =
  | 'umbrella'
  | 'weeping'
  | 'conifer'
  | 'bush'
  | 'grass'
  | 'cover'
  | 'flower'
  | 'mushroom'
  | 'stone'

export interface PlantRecipe {
  kind: PlantKind
  count: number
  rx: number
  rz: number
  color?: 'main' | 'accent' | 'trunk' | string
  color2?: 'main' | 'accent' | 'trunk' | string
  scale?: number
}

export interface GroveData {
  id: string
  name: string
  subtitle: string
  /** 简介（hover 信息卡） */
  description: string
  /** 发病率（hover 信息卡的"珍稀度"） */
  prevalence: string
  position: [number, number]
  size: number
  mainColor: string
  accentColor: string
  trunk: string
  recipe: PlantRecipe[]
}

export const GROVES: GroveData[] = [
  /* 1. 渐冻症 · 白桦林 */
  {
    id: 'als',
    name: '渐冻症',
    subtitle: 'ALS · 白桦林',
    description: '运动神经元逐渐凋零，患者意识清醒却被困于身体。如冬日白桦，挺拔静默。',
    prevalence: '约 1 / 50,000',
    position: [-19, -13],
    size: 7,
    mainColor: '#7fb88a',
    accentColor: '#f5e9a8',
    trunk: '#e8e0c8',
    recipe: [
      { kind: 'conifer', count: 14, rx: 5.5, rz: 5.5, color: 'main' },
      { kind: 'bush', count: 22, rx: 6.5, rz: 6.5, color: '#8fcc92', color2: 'accent' },
      { kind: 'grass', count: 30, rx: 6.5, rz: 6.5, color: '#e8d878', color2: 'accent' },
      { kind: 'cover', count: 28, rx: 7, rz: 7, color: '#a8d878', color2: '#f0e890' },
      { kind: 'flower', count: 12, rx: 6, rz: 6, color: '#fff080' },
    ],
  },

  /* 2. SMA · 樱花谷 */
  {
    id: 'sma',
    name: '脊髓性肌萎缩症',
    subtitle: 'SMA · 樱花谷',
    description: '婴幼儿期发病的运动神经元疾病，曾经无药可治，如今已有救命基因疗法。',
    prevalence: '约 1 / 10,000',
    position: [-4, -10],
    size: 7,
    mainColor: '#ff85b5',
    accentColor: '#ffd0e0',
    trunk: '#7a5a3a',
    recipe: [
      { kind: 'weeping', count: 8, rx: 5, rz: 5, color: 'main', color2: 'accent' },
      { kind: 'bush', count: 22, rx: 6.5, rz: 6.5, color: '#ff7aa8', color2: 'accent' },
      { kind: 'flower', count: 36, rx: 6.5, rz: 6.5, color: '#ff5090' },
      { kind: 'cover', count: 32, rx: 7, rz: 7, color: '#ffa8c8', color2: '#ffe0ec' },
      { kind: 'grass', count: 14, rx: 6.5, rz: 6.5, color: '#e090b0', color2: 'accent' },
    ],
  },

  /* 3. 戈谢病 · 守护者 */
  {
    id: 'gaucher',
    name: '戈谢病',
    subtitle: '守护者之树',
    description: '葡萄糖脑苷脂酶缺乏导致的溶酶体贮积病，酶替代疗法让生命继续生长。',
    prevalence: '约 1 / 40,000',
    position: [16, -11],
    size: 7,
    mainColor: '#5fb060',
    accentColor: '#cfe87a',
    trunk: '#6b4a2a',
    recipe: [
      { kind: 'umbrella', count: 1, rx: 0, rz: 0, color: 'main', color2: 'accent', scale: 1.8 },
      { kind: 'umbrella', count: 3, rx: 5, rz: 5, color: '#6fc070', color2: 'accent', scale: 0.9 },
      { kind: 'bush', count: 22, rx: 6.5, rz: 6.5, color: 'main', color2: 'accent' },
      { kind: 'stone', count: 12, rx: 6, rz: 6 },
      { kind: 'grass', count: 24, rx: 6.5, rz: 6.5, color: '#a8d050', color2: 'accent' },
      { kind: 'cover', count: 28, rx: 7, rz: 7, color: '#7ec850', color2: '#d0e878' },
    ],
  },

  /* 4. 法布雷病 · 金叶大道 */
  {
    id: 'fabry',
    name: '法布雷病',
    subtitle: '金叶大道',
    description: 'X 染色体连锁的溶酶体贮积病，影响心、肾、神经。命运虽难，仍要发光。',
    prevalence: '约 1 / 40,000',
    position: [-15, 6],
    size: 7,
    mainColor: '#f5b520',
    accentColor: '#ffd860',
    trunk: '#7a5a2a',
    recipe: [
      { kind: 'umbrella', count: 9, rx: 5.5, rz: 5.5, color: 'main', color2: 'accent' },
      { kind: 'bush', count: 20, rx: 6.5, rz: 6.5, color: '#ecb030', color2: 'accent' },
      { kind: 'grass', count: 26, rx: 6.5, rz: 6.5, color: '#d8a020', color2: '#fad858' },
      { kind: 'cover', count: 26, rx: 7, rz: 7, color: '#e8b830', color2: '#ffe070' },
      { kind: 'flower', count: 14, rx: 6, rz: 6, color: '#ffd040' },
    ],
  },

  /* 5. 庞贝病 · 古蕨地 */
  {
    id: 'pompe',
    name: '庞贝病',
    subtitle: '古蕨地',
    description: '糖原贮积病 II 型，肌肉与心脏渐受影响。如太古蕨类，沉静而坚韧。',
    prevalence: '约 1 / 40,000',
    position: [2, 9],
    size: 7,
    mainColor: '#4a9650',
    accentColor: '#a8d068',
    trunk: '#3e2a1a',
    recipe: [
      { kind: 'umbrella', count: 2, rx: 2, rz: 2, color: 'main', color2: 'accent', scale: 1.4 },
      { kind: 'grass', count: 38, rx: 6.5, rz: 6.5, color: '#5ca858', color2: 'accent' },
      { kind: 'bush', count: 22, rx: 6.5, rz: 6.5, color: '#6cb058', color2: '#a8d068' },
      { kind: 'cover', count: 36, rx: 7, rz: 7, color: '#4a9050', color2: '#90c050' },
      { kind: 'mushroom', count: 12, rx: 5.5, rz: 5.5, color: '#b8552a' },
      { kind: 'mushroom', count: 6, rx: 5, rz: 5, color: '#f08850' },
    ],
  },

  /* 6. 血友病 · 红枫丘 */
  {
    id: 'hemophilia',
    name: '血友病',
    subtitle: '红枫丘',
    description: '凝血因子缺乏，每一次磕碰都更危险。如秋日红枫，鲜艳而需小心呵护。',
    prevalence: '约 1 / 10,000 男性',
    position: [18, 5],
    size: 7,
    mainColor: '#e84830',
    accentColor: '#ff9060',
    trunk: '#5a3020',
    recipe: [
      { kind: 'umbrella', count: 7, rx: 5, rz: 5, color: 'main', color2: 'accent' },
      { kind: 'bush', count: 22, rx: 6.5, rz: 6.5, color: '#dc5840', color2: 'accent' },
      { kind: 'flower', count: 26, rx: 6.5, rz: 6.5, color: '#f04830' },
      { kind: 'cover', count: 28, rx: 7, rz: 7, color: '#d05030', color2: '#f59060' },
      { kind: 'grass', count: 14, rx: 6.5, rz: 6.5, color: '#c86840', color2: 'accent' },
    ],
  },

  /* 7. 白化病 · 月光花海 */
  {
    id: 'albinism',
    name: '白化病',
    subtitle: '月光花海',
    description: '黑色素生成异常，皮肤、毛发、眼睛失去保护色。如月光下的花海，纯净纤细。',
    prevalence: '约 1 / 17,000',
    position: [-22, 16],
    size: 7,
    mainColor: '#f0e0d0',
    accentColor: '#ffffff',
    trunk: '#d8d0c0',
    recipe: [
      { kind: 'weeping', count: 3, rx: 3, rz: 3, color: 'main', color2: 'accent', scale: 1.25 },
      { kind: 'bush', count: 22, rx: 6.5, rz: 6.5, color: '#ece4d0', color2: 'accent' },
      { kind: 'flower', count: 46, rx: 7, rz: 7, color: '#ffffff' },
      { kind: 'cover', count: 36, rx: 7, rz: 7, color: '#e8e0c8', color2: '#ffffff' },
      { kind: 'grass', count: 22, rx: 7, rz: 7, color: '#d8d0b8', color2: '#ffffff' },
    ],
  },

  /* 8. PKU · 苹果园 */
  {
    id: 'pku',
    name: '苯丙酮尿症',
    subtitle: 'PKU · 苹果园',
    description: '苯丙氨酸代谢障碍，需终生饮食控制。如低苯果园，苹果鲜红，却需精心挑选。',
    prevalence: '约 1 / 11,000',
    position: [-8, 18],
    size: 7,
    mainColor: '#6cb840',
    accentColor: '#ec3030',
    trunk: '#6b4a2a',
    recipe: [
      { kind: 'umbrella', count: 9, rx: 5.5, rz: 5.5, color: 'main', color2: 'accent' },
      { kind: 'bush', count: 22, rx: 6.5, rz: 6.5, color: '#5ca830', color2: '#a8d050' },
      { kind: 'flower', count: 26, rx: 6.5, rz: 6.5, color: '#e84030' },
      { kind: 'cover', count: 26, rx: 7, rz: 7, color: '#6cb840', color2: '#b8d860' },
      { kind: 'grass', count: 12, rx: 6.5, rz: 6.5, color: '#88b850', color2: 'accent' },
    ],
  },

  /* 9. 肺动脉高压 · 蓝雾园 */
  {
    id: 'pah',
    name: '肺动脉高压',
    subtitle: '蓝雾园',
    description: '肺动脉压力升高，呼吸如负重行走。如紫蓝色的雾园，神秘而需要耐心。',
    prevalence: '约 1 / 100,000',
    position: [13, 17],
    size: 7,
    mainColor: '#7868d8',
    accentColor: '#c8b8f5',
    trunk: '#5a4e7a',
    recipe: [
      { kind: 'weeping', count: 7, rx: 5, rz: 5, color: 'main', color2: 'accent' },
      { kind: 'bush', count: 22, rx: 6.5, rz: 6.5, color: '#7e6cd0', color2: 'accent' },
      { kind: 'flower', count: 34, rx: 6.5, rz: 6.5, color: '#6048c8' },
      { kind: 'grass', count: 26, rx: 6.5, rz: 6.5, color: '#9080d0', color2: '#c8b8f5' },
      { kind: 'cover', count: 26, rx: 7, rz: 7, color: '#8878d0', color2: '#d4c8f0' },
    ],
  },

  /* 10. MPS · 彩蘑林 */
  {
    id: 'mps',
    name: '黏多糖贮积症',
    subtitle: 'MPS · 彩蘑林',
    description: '一组溶酶体贮积病，身体细胞无法正常分解黏多糖。如彩色蘑菇，奇异而珍稀。',
    prevalence: '约 1 / 25,000',
    position: [25, 16],
    size: 7,
    mainColor: '#5fb060',
    accentColor: '#ff8048',
    trunk: '#5a3a2a',
    recipe: [
      { kind: 'umbrella', count: 5, rx: 4, rz: 4, color: 'main', color2: '#b8e060' },
      { kind: 'mushroom', count: 24, rx: 6, rz: 6, color: '#ff5848' },
      { kind: 'mushroom', count: 18, rx: 6, rz: 6, color: '#ffb030' },
      { kind: 'mushroom', count: 14, rx: 6, rz: 6, color: '#e060a0' },
      { kind: 'bush', count: 18, rx: 6.5, rz: 6.5, color: '#6cb840', color2: '#b8e060' },
      { kind: 'cover', count: 28, rx: 7, rz: 7, color: '#5ca830', color2: '#b8e060' },
      { kind: 'grass', count: 14, rx: 6.5, rz: 6.5, color: '#88b850', color2: 'accent' },
    ],
  },
]
