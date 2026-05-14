/**
 * 知识库 Store
 * - localStorage 持久化（单机 demo），UI 直接订阅
 * - 数据结构面向公益机构真实场景：病种科普 / FAQ / 救助基金 / 专科医院
 */
import { useSyncExternalStore } from 'react'

export type KbCategory = 'disease' | 'faq' | 'fund' | 'hospital'

export interface KbItem {
  id: string
  category: KbCategory
  title: string
  /** 简短摘要，AI 召回时优先 */
  summary: string
  content: string
  keywords: string[]
  /** 关联病种 id（可选） */
  diseaseId?: string
  updatedAt: number
}

export const KB_CATEGORY_LABEL: Record<KbCategory, string> = {
  disease: '病种科普',
  faq: '常见问答',
  fund: '救助基金',
  hospital: '专科医院',
}

const STORAGE_KEY = 'glimmer.kb.v2'

const DEFAULTS: KbItem[] = [
  {
    id: 'kb-sma-intro',
    category: 'disease',
    title: 'SMA（脊髓性肌萎缩症）基础科普',
    summary: '一种常染色体隐性遗传的运动神经元病，按发病年龄分为 0–4 型。',
    content:
      'SMA 由 SMN1 基因缺陷导致脊髓前角运动神经元退化，进而引发肌肉无力与萎缩。早期诊断与药物干预（诺西那生钠、利司扑兰、Onasemnogene Abeparvovec）可显著改善预后。新生儿建议筛查。',
    keywords: ['SMA', '脊髓性肌萎缩', 'SMN1', '诺西那生', '利司扑兰'],
    diseaseId: 'sma',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'kb-sma-fund',
    category: 'fund',
    title: 'SMA 患者可申请的主要救助基金',
    summary: '国家医保已纳入诺西那生钠、利司扑兰；可叠加美儿基金、病痛挑战基金等社会救助。',
    content:
      '1）国家医保乙类：诺西那生钠、利司扑兰，按当地报销政策执行；\n2）美儿 SMA 关爱中心：药品援助 + 康复补贴；\n3）病痛挑战基金会：罕见病多病种综合救助；\n4）地方专项：部分省市另有一次性补助，建议联系当地民政或残联确认。',
    keywords: ['SMA', '基金', '救助', '医保', '美儿'],
    diseaseId: 'sma',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: 'kb-sma-hospital',
    category: 'hospital',
    title: 'SMA 主要诊疗中心（参考）',
    summary: '北京、上海、广州、深圳等地三甲儿科神经/神经内科为主。',
    content:
      '北京：北京大学第一医院儿科、首都儿科研究所；\n上海：复旦大学附属儿科医院神经科、上海儿童医学中心；\n广州：广州市妇女儿童医疗中心；\n深圳：深圳市儿童医院；\n建议提前电话确认专家排班与基因检测能力。',
    keywords: ['SMA', '医院', '诊疗中心', '神经科'],
    diseaseId: 'sma',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'kb-faq-confirm',
    category: 'faq',
    title: '怀疑罕见病该如何启动确诊流程？',
    summary: '门诊评估 → 基因/生化检测 → 多学科会诊 → 出具诊断结论。',
    content:
      '第一步：在所在地三甲医院相关专科门诊（神经/儿科/血液/代谢等）就诊；\n第二步：根据临床表型完善基因检测或生化检测；\n第三步：必要时申请 MDT 多学科会诊；\n第四步：保留所有报告原件，未来基金申请、医保备案均会用到。',
    keywords: ['确诊', '基因检测', 'MDT', '诊断流程'],
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'kb-faq-care',
    category: 'faq',
    title: '罕见病家庭日常照护通用建议',
    summary: '稳定作息、营养均衡、定期随访、心理支持四个维度。',
    content:
      '1）作息：保证规律睡眠，避免过度疲劳；\n2）营养：按疾病类型咨询营养科，必要时定制食谱；\n3）随访：建立病程档案，按医嘱定期复查；\n4）心理：家属同等需要支持，可联系机构心理志愿者。',
    keywords: ['照护', '护理', '日常', '心理'],
    updatedAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: 'kb-faq-insurance',
    category: 'faq',
    title: '罕见病用药如何与基本医保 + 商业保险衔接？',
    summary: '先确认是否纳入国家医保目录或地方惠民保，再叠加商业险。',
    content:
      '1）国家医保目录：每年动态调整，可登录国家医保局官网查询最新版本；\n2）地方惠民保（如沪惠保、深圳惠民保）：通常对特定罕见病高价药有专项额度；\n3）商业重疾/医疗险：投保前请如实告知，避免理赔纠纷；\n4）建议联系机构社工协助梳理叠加路径。',
    keywords: ['医保', '惠民保', '商业保险', '报销'],
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'kb-fund-overview',
    category: 'fund',
    title: '罕见病综合救助基金一览（通用）',
    summary: '病痛挑战、瓷娃娃、蔻德、罕见病联盟等。',
    content:
      '1）病痛挑战基金会：综合多病种，重点支持医疗费用；\n2）瓷娃娃罕见病关爱中心：成骨不全症等；\n3）蔻德罕见病中心 CORD：政策倡导 + 部分项目资助；\n4）中国罕见病联盟：协调多方资源；\n联系前请准备好诊断证明、低保证明（如有）、费用清单。',
    keywords: ['基金', '救助', '病痛挑战', '瓷娃娃', '蔻德'],
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'kb-faq-school',
    category: 'faq',
    title: '罕见病儿童入学/就学常见问题',
    summary: '依法保障受教育权；可申请陪读、走读、个性化教育方案。',
    content:
      '1）法律层面：《义务教育法》保障所有适龄儿童受教育权；\n2）入学协商：与学校沟通陪读、午休、用药等具体安排；\n3）特教资源：可咨询当地特殊教育中心；\n4）心理建设：家长与教师需共同关注同学间的接纳与融合。',
    keywords: ['入学', '上学', '陪读', '特教'],
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },

  /* ───── ALS（渐冻症） ───── */
  {
    id: 'kb-als-intro',
    category: 'disease',
    title: 'ALS（渐冻症 / 肌萎缩侧索硬化）基础科普',
    summary: '运动神经元进行性退行，从局部肌无力发展至全身瘫痪与吞咽呼吸困难。',
    content:
      'ALS 是一种成人起病的运动神经元病，多在 50–70 岁起病。早期常见手部精细动作下降、吞咽呛咳、肌肉跳动；中后期累及呼吸肌。\n药物：利鲁唑、依达拉奉可在一定程度上延缓进展。\n非药物：呼吸支持（无创呼吸机）、营养支持（鼻饲/胃造瘘）、康复训练、辅具适配是延长生存期的关键。\n建议尽早建立 MDT（神经内科 + 呼吸科 + 营养 + 康复 + 心理）随访方案。',
    keywords: ['ALS', '渐冻症', '运动神经元', '利鲁唑', '依达拉奉', '呼吸支持'],
    diseaseId: 'als',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
  {
    id: 'kb-als-fund',
    category: 'fund',
    title: 'ALS 患者可使用的救助与政策资源',
    summary: '医保乙类药物 + 病痛挑战基金 + 渐冻人协会 + 部分地方惠民保。',
    content:
      '1）国家医保乙类：依达拉奉、利鲁唑可按当地比例报销；\n2）病痛挑战基金会"渐冻人专项"：可申请医疗费用补助；\n3）中国渐冻人协会及各地"渐冻人之家"：辅具租借、社工陪伴、临终关怀；\n4）地方惠民保：上海"沪惠保"等部分项目对呼吸机、雾化、护理耗材有专项额度；\n5）残疾人证：建议尽早办理，便于申请辅具补贴和护理补贴。',
    keywords: ['ALS', '渐冻症', '基金', '医保', '残疾证', '惠民保'],
    diseaseId: 'als',
    updatedAt: Date.now() - 1000 * 60 * 60 * 36,
  },

  /* ───── 戈谢病（Gaucher） ───── */
  {
    id: 'kb-gaucher-intro',
    category: 'disease',
    title: '戈谢病基础科普',
    summary: '溶酶体贮积症之一，葡萄糖脑苷脂酶缺陷导致脏器、骨骼受累。',
    content:
      '戈谢病由 GBA 基因突变导致葡萄糖脑苷脂酶活性下降，糖脂在巨噬细胞内蓄积。\n常见表现：肝脾肿大、贫血、血小板低、骨痛与骨危象；I 型最常见、不累及神经系统。\n诊断：酶活性检测 + 基因检测确诊，骨髓涂片可见戈谢细胞。\n治疗：酶替代治疗（伊米苷酶、维拉苷酶 α）和底物减少治疗（依利格鲁司他）已在国内上市，需长期规律用药。',
    keywords: ['戈谢病', 'Gaucher', '伊米苷酶', '酶替代', '溶酶体', 'GBA'],
    diseaseId: 'gaucher',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'kb-gaucher-fund',
    category: 'fund',
    title: '戈谢病患者可申请的救助通道',
    summary: '医保 + "健行者"项目 + 病痛挑战基金 + 商业保险叠加。',
    content:
      '1）国家医保：伊米苷酶等酶替代药已被纳入医保乙类，部分省份"双通道"管理；\n2）中华慈善总会"健行者"项目：长期为戈谢病患者提供药品援助，需在指定医院注册建档；\n3）病痛挑战基金会：罕见病多病种综合救助；\n4）商业重疾险：投保前如实告知，部分公司对已确诊戈谢病有专项条款；\n5）建议保留诊断证明、酶活性报告、用药记录原件，便于历次申请。',
    keywords: ['戈谢病', '健行者', '医保', '双通道', '酶替代', '基金'],
    diseaseId: 'gaucher',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },

  /* ───── 法布雷病（Fabry） ───── */
  {
    id: 'kb-fabry-intro',
    category: 'disease',
    title: '法布雷病基础科普',
    summary: 'X 连锁溶酶体贮积症，累及肾、心、神经与皮肤。',
    content:
      '法布雷病由 GLA 基因缺陷导致 α-半乳糖苷酶活性不足，神经鞘脂在血管和脏器堆积。\n典型表现：手足烧灼痛、少汗、血管角质瘤、蛋白尿/肾功能下降、心肌肥厚、卒中。\n诊断：男性首选酶活性检测，女性需基因检测确诊。\n治疗：酶替代治疗（阿加糖酶 α/β）、口服伴侣分子治疗（米加司他）；多学科随访（肾、心、神经）。',
    keywords: ['法布雷', 'Fabry', 'GLA', '酶替代', '阿加糖酶', '米加司他'],
    diseaseId: 'fabry',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'kb-fabry-fund',
    category: 'fund',
    title: '法布雷病患者的救助与医保路径',
    summary: '医保乙类 + 中华慈善总会援助 + 部分地方惠民保。',
    content:
      '1）国家医保乙类：阿加糖酶 α、阿加糖酶 β、米加司他已陆续纳入；\n2）中华慈善总会"法布雷病援助项目"：在指定医院可申请药品援助；\n3）地方惠民保：上海、浙江、广东等部分省市惠民保对法布雷高价药有专项额度；\n4）家系筛查建议：法布雷为 X 连锁遗传，建议姐妹/母亲/子女主动接受基因检测；\n5）社工可协助梳理多档报销叠加路径。',
    keywords: ['法布雷', 'Fabry', '医保', '惠民保', '阿加糖酶', '家系筛查'],
    diseaseId: 'fabry',
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
  },

  /* ───── 庞贝病（Pompe） ───── */
  {
    id: 'kb-pompe-intro',
    category: 'disease',
    title: '庞贝病基础科普',
    summary: '糖原贮积症 II 型，累及骨骼肌、心肌与呼吸肌。',
    content:
      '庞贝病由 GAA 基因缺陷导致酸性 α-葡萄糖苷酶缺乏，糖原在溶酶体内堆积。\n婴儿型起病早、心肌肥厚明显，进展迅速；晚发型可在儿童或成人期起病，以肢带肌无力和呼吸功能下降为主。\n诊断：干血斑酶活性检测 + 基因检测。\n治疗：酶替代治疗（阿糖苷酶 α）已在国内上市；建议尽早启动，并配合呼吸支持、康复训练。',
    keywords: ['庞贝病', 'Pompe', 'GAA', '酶替代', '阿糖苷酶', '糖原贮积'],
    diseaseId: 'pompe',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'kb-pompe-fund',
    category: 'fund',
    title: '庞贝病救助与社会支持',
    summary: '医保乙类 + 中华慈善总会援助 + 病痛挑战基金。',
    content:
      '1）国家医保乙类：阿糖苷酶 α 已纳入，按当地"双通道"政策执行；\n2）中华慈善总会"庞贝病援助项目"：长期提供药品援助；\n3）病痛挑战基金会：可叠加医疗费用资助；\n4）呼吸支持耗材：部分省市惠民保覆盖无创呼吸机、雾化器等；\n5）建议尽早办理残疾人证以申请护理及辅具补贴。',
    keywords: ['庞贝病', 'Pompe', '医保', '阿糖苷酶', '双通道', '基金'],
    diseaseId: 'pompe',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },

  /* ───── 血友病（Hemophilia） ───── */
  {
    id: 'kb-hemophilia-intro',
    category: 'disease',
    title: '血友病基础科普',
    summary: 'X 连锁隐性遗传，凝血因子 VIII / IX 缺乏，反复关节肌肉出血。',
    content:
      '血友病分为 A 型（FVIII 缺乏）和 B 型（FIX 缺乏），主要见于男性。\n常见表现：反复关节出血（膝、踝、肘）、肌肉血肿、外伤后出血不止；长期未规范治疗会发生血友病性关节病变。\n治疗：按需治疗已不再是首选，国际指南推荐"预防治疗"——定期输注凝血因子或使用艾美赛珠单抗（B 型暂无）；同时关注关节康复与心理支持。',
    keywords: ['血友病', 'Hemophilia', 'FVIII', 'FIX', '艾美赛珠', '预防治疗'],
    diseaseId: 'hemophilia',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'kb-hemophilia-fund',
    category: 'fund',
    title: '血友病医保与援助资源',
    summary: '医保门特/门慢 + 中国血友之家 + 部分地方专项救助。',
    content:
      '1）国家医保：凝血因子类药品已纳入，部分省市设"门诊特殊病种"或"门慢"以解决长期用药报销问题；\n2）中国血友之家（NHF China）：政策咨询、患教课程、康复指导、夏令营；\n3）艾美赛珠单抗（罗氏诊断）：在多省纳入医保后报销比例显著提升，部分地方惠民保有补充；\n4）儿童患者可联系当地慈善总会、红会咨询专项；\n5）出血急救：建议家中常备凝血因子并掌握 RICE 处理原则。',
    keywords: ['血友病', '医保', '门特', '艾美赛珠', '血友之家', 'RICE'],
    diseaseId: 'hemophilia',
    updatedAt: Date.now() - 1000 * 60 * 60 * 30,
  },

  /* ───── 白化病（Albinism） ───── */
  {
    id: 'kb-albinism-intro',
    category: 'disease',
    title: '白化病基础科普',
    summary: '黑色素合成缺陷，皮肤毛发苍白，视力发育异常是主要功能影响。',
    content:
      '白化病多为常染色体隐性遗传，OCA 系列基因突变最常见。\n表现：皮肤、毛发苍白；瞳孔可呈淡红/灰蓝；视力问题包括眼球震颤、屈光不正、黄斑发育不良、畏光；皮肤紫外线损伤风险增高。\n核心是"功能康复 + 防护"：低视力康复训练、专业屈光矫正、严格防晒、定期皮肤科随访以早筛皮肤癌。\n智力与寿命通常不受影响。',
    keywords: ['白化病', 'Albinism', 'OCA', '低视力', '防晒', '眼球震颤'],
    diseaseId: 'albinism',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'kb-albinism-fund',
    category: 'fund',
    title: '白化病社会支持与就学就业资源',
    summary: '残联视力残疾认定 + 月亮孩子之家 + 教育/就业平等权益。',
    content:
      '1）视力残疾认定：达标可办理视力残疾人证，享受康复训练、辅具补贴、教育与就业支持；\n2）月亮孩子之家（北京）：白化病专属公益机构，提供心理疏导、家长互助、防晒物资、夏令营；\n3）入学/高考：可向所在地教育考试院申请合理便利（放大试卷、延长时间等）；\n4）就业平等：《残疾人就业条例》保障就业权利；\n5）防晒物资：高 SPF 防晒霜、防紫外线衣帽、UV400 太阳镜建议家中常备。',
    keywords: ['白化病', '月亮孩子之家', '视力残疾', '残疾证', '高考便利', '防晒'],
    diseaseId: 'albinism',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },

  /* ───── 苯丙酮尿症（PKU） ───── */
  {
    id: 'kb-pku-intro',
    category: 'disease',
    title: 'PKU（苯丙酮尿症）基础科普',
    summary: '常染色体隐性遗传氨基酸代谢病，新生儿筛查普查项之一。',
    content:
      'PKU 由 PAH 基因缺陷导致苯丙氨酸代谢受阻，长期高苯丙氨酸血症会损伤大脑发育。\n所有新生儿均会进行足跟血筛查，确诊后越早开始干预，预后越好。\n核心治疗：终生低苯丙氨酸饮食 + 特殊医学用途食品（无苯丙氨酸奶粉/蛋白粉）；BH4 反应型可加用沙丙蝶呤。\n孕期女性 PKU 患者必须严格控制血苯丙氨酸水平，避免胎儿损害。',
    keywords: ['PKU', '苯丙酮尿症', 'PAH', '低苯饮食', '特殊食品', '新筛'],
    diseaseId: 'pku',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'kb-pku-fund',
    category: 'fund',
    title: 'PKU 特殊食品与医保政策',
    summary: '部分省市将无苯丙氨酸奶粉/蛋白粉纳入门特报销；可叠加慈善援助。',
    content:
      '1）特殊医学用途食品：上海、江苏、浙江、广东等多省已将 PKU 特殊食品纳入医保门特或地方专项补贴；\n2）国家及省级残联："罕见病儿童救助项目"对部分家庭按年发放补助；\n3）中华慈善总会、民间公益基金：不定期开展 PKU 特殊食品物资援助；\n4）惠民保：上海"沪惠保"等对 PKU 特殊食品有补充支付；\n5）建议每月血斑随访，并保留所有购药/购粉发票，方便报销。',
    keywords: ['PKU', '特殊食品', '医保门特', '惠民保', '补助', '血斑'],
    diseaseId: 'pku',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },

  /* ───── 肺动脉高压（PAH） ───── */
  {
    id: 'kb-pah-intro',
    category: 'disease',
    title: '肺动脉高压（PAH）基础科普',
    summary: '肺动脉压力进行性升高，呼吸困难、活动耐量下降是主要表现。',
    content:
      'PAH 包括特发性、遗传性以及与结缔组织病、先心病等相关的多种亚型。\n症状：劳力性呼吸困难、乏力、胸痛、晕厥、下肢水肿。\n诊断：超声心动图初筛 + 右心导管检查确诊（金标准）。\n治疗：靶向药物（ERA、PDE5i、前列环素类、sGC 激动剂）按 WHO 功能分级阶梯使用；建议在有 PAH 中心资质的医院随访，3–6 个月评估一次。\n非药物：氧疗、康复训练、避免高海拔与剧烈运动、慎用某些含麻黄碱类感冒药。',
    keywords: ['PAH', '肺动脉高压', '右心导管', '靶向药', 'WHO 分级', '氧疗'],
    diseaseId: 'pah',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'kb-pah-fund',
    category: 'fund',
    title: 'PAH 用药报销与社会资源',
    summary: '多种靶向药已纳入医保，可叠加蓝唇关爱中心等公益资源。',
    content:
      '1）国家医保乙类：波生坦、安立生坦、马昔腾坦、利奥西呱、司来帕格等多种 PAH 靶向药已纳入；部分省份"双通道"管理；\n2）蓝唇关爱中心：PAH 专属公益机构，提供患教课程、心理支持、社工对接；\n3）中华慈善总会"PAH 患者援助项目"：在指定医院可申请药品援助；\n4）惠民保：部分省市惠民保对 PAH 高价药有补充支付额度；\n5）出行建议：长途/高原出行前与主治医生评估，备好便携氧。',
    keywords: ['PAH', '医保', '波生坦', '蓝唇', '靶向药', '双通道'],
    diseaseId: 'pah',
    updatedAt: Date.now() - 1000 * 60 * 60 * 36,
  },

  /* ───── 黏多糖贮积症（MPS） ───── */
  {
    id: 'kb-mps-intro',
    category: 'disease',
    title: 'MPS（黏多糖贮积症）基础科普',
    summary: '溶酶体贮积症的一组疾病，涉及多脏器多骨骼系统的进行性损害。',
    content:
      'MPS 包括 I、II、III、IV、VI、VII、IX 等多种类型，分别由不同酶缺陷导致黏多糖在溶酶体内堆积。\n常见表现：特殊面容、关节僵硬、身材矮小、肝脾肿大、心脏瓣膜病变、角膜混浊、神经认知受累（部分型号）。\n诊断：尿黏多糖筛查 + 酶活性检测 + 基因检测。\n治疗：MPS I（拉罗尼酶）、II（艾杜糖酶 β）、IVA（依洛硫酸酯酶 α）、VI（加硫酶 α）已有酶替代治疗药物在国内上市；造血干细胞移植对部分型号在早期有效。',
    keywords: ['MPS', '黏多糖', '酶替代', '拉罗尼酶', '艾杜糖酶', '造血干细胞'],
    diseaseId: 'mps',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'kb-mps-fund',
    category: 'fund',
    title: 'MPS 患者救助与多学科随访建议',
    summary: '医保 + 多家慈善援助 + 多学科长期随访。',
    content:
      '1）国家医保乙类：拉罗尼酶（MPS I）、艾杜糖酶 β（MPS II）、依洛硫酸酯酶 α（MPS IVA）已陆续纳入；\n2）慈善援助：中华慈善总会、罕见病发展中心 CORD、瓷娃娃罕见病关爱中心等多家机构均有针对 MPS 的专项援助通道；\n3）地方惠民保：北京、上海、广州、深圳等地对 MPS 高价药有补充支付；\n4）随访建议：MPS 累及多系统，需骨科、心内、眼科、耳鼻喉、神经、麻醉等多学科共同随访（麻醉风险高，术前必须评估）；\n5）患者组织：可联系"MPS 之家"获取家庭互助资源。',
    keywords: ['MPS', '黏多糖', '医保', '惠民保', '拉罗尼酶', '艾杜糖酶', 'MDT'],
    diseaseId: 'mps',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
]

interface KbState {
  items: KbItem[]
}

let state: KbState = load()
const listeners = new Set<() => void>()

function load(): KbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as KbState
      if (Array.isArray(parsed.items)) return parsed
    }
  } catch {
    // ignore
  }
  return { items: DEFAULTS }
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}
function emit() {
  listeners.forEach((l) => l())
}

export function useKb(): KbItem[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state.items,
    () => state.items
  )
}
export function getKb(): KbItem[] {
  return state.items
}

export function addKb(input: Omit<KbItem, 'id' | 'updatedAt'>): KbItem {
  const item: KbItem = {
    ...input,
    id: `kb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    updatedAt: Date.now(),
  }
  state = { items: [item, ...state.items] }
  persist()
  emit()
  return item
}

export function updateKb(id: string, patch: Partial<Omit<KbItem, 'id'>>) {
  state = {
    items: state.items.map((it) =>
      it.id === id ? { ...it, ...patch, updatedAt: Date.now() } : it
    ),
  }
  persist()
  emit()
}

export function deleteKb(id: string) {
  state = { items: state.items.filter((it) => it.id !== id) }
  persist()
  emit()
}

export function resetKb() {
  state = { items: DEFAULTS }
  persist()
  emit()
}

/**
 * 简易召回：按关键词/标题/摘要匹配，返回最多 N 条。
 * 真实接入时可换成向量召回。
 */
/**
 * 召回知识库条目。
 *
 * @param query 用户问题（已可附带林地名）
 * @param limit 最多返回条数
 * @param diseaseId 当前所在林地对应的病种 id（可选）。一旦传入：
 *   - 与该病种关联的条目额外 +6 分（强提权）
 *   - 与其他病种关联的条目（diseaseId 存在但不匹配）额外 -3 分（抑制串台）
 *   - 通用条目（无 diseaseId，比如 FAQ）不加不减
 */
export function recallKb(query: string, limit = 3, diseaseId?: string): KbItem[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const scored = state.items.map((it) => {
    let score = 0
    const hay = (it.title + ' ' + it.summary + ' ' + it.keywords.join(' ')).toLowerCase()
    if (hay.includes(q)) score += 5
    for (const kw of it.keywords) {
      if (q.includes(kw.toLowerCase())) score += 3
    }
    if (it.title.toLowerCase().includes(q)) score += 4

    // 病种维度加权：让"庞贝病林地问医保"召回庞贝病自己的 fund，而不是 SMA 的
    if (diseaseId) {
      if (it.diseaseId === diseaseId) {
        score += 6
      } else if (it.diseaseId) {
        score -= 3
      }
      // 病种林地下，对该病种的条目即使关键词没命中，也给一点底分让它能浮上来
      if (it.diseaseId === diseaseId && score === 0) {
        score = 2
      }
    }

    return { it, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.it)
}
