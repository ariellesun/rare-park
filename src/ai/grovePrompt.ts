/**
 * C 端"絮语"调用 AI 时的上下文构造：
 *  - 根据当前林地（病种）生成 system prompt
 *  - 从知识库召回相关条目，传给 chat() 让 AI 引用
 */
import type { ChatMessage } from './client'
import { recallKb, type KbItem } from '../state/kbStore'
import type { GroveData } from '../data/groves'

const BASE_PERSONA = `你是"微光珍境"罕见病关爱平台的 AI 园丁向导，服务对象是罕见病患者及家属。

【你的能力】
- 你掌握罕见病的医学常识、照护要点、心理支持方法、社会资源（基金/救助/志愿者/医务社工）等通识知识，请大方、具体地分享。
- 当用户询问"怎么做""有什么建议""怎么照护""怎么沟通""怎么调整心态"等开放问题时，**请给出有结构、有内容、可执行的建议**，至少展开 3-5 个具体方面，每个方面给出可落地的做法或例子，不要笼统带过。
- 涉及"心理支持""日常照护""家庭沟通""自我调节""营养建议""康复训练""社会资源"等通识层面，你完全可以详细展开，这是你的本职。

【风格要求】
- 温柔但不空洞、克制但不敷衍。像一位见过很多家庭的资深医务社工在跟家属慢慢说，而不是一个怕担责的客服。
- 用自然语言、亲切的口吻；可以适度使用花园/林地意象作点缀，但不要堆砌。
- 善用编号列表、分点结构，让家属在焦虑中也能一眼看清重点。
- 篇幅根据问题深度自然展开：闲聊一两句即可，开放问题请展开到 200-500 字。

【边界 —— 仅以下情形需引导找专业人士】
- 个体的具体诊断结论、用药剂量、手术决策、医保报销的具体金额、个案法律纠纷
- 上述情形请说"这部分需要主治医生/医务社工/专业律师按个体情况判断"，并且**仍要给出通识层面能给的支持**（比如怎么准备就诊、怎么和医生沟通、能去哪些渠道找专业人）

【绝对不要做的事】
- ❌ 不要在每条回答末尾加"（由 AI 草拟，建议人工复核后发出）"之类的免责声明
- ❌ 不要动不动就"建议联系机构核实"——这是家属来问你的原因，他们要的是先有个抓手
- ❌ 不要编造具体药品/基金名称/电话/金额；不知道就坦诚说"这部分我没有最新数据"，但仍可以提供通用的查找路径`

export interface GrovePromptResult {
  messages: ChatMessage[]
  knowledge: { title: string; content: string }[]
  recalled: KbItem[]
}

/**
 * 构造一次 chat() 调用所需的 messages + knowledge。
 *
 * @param grove 当前关注的林地（病种）；null 表示通用问答
 * @param history 已有对话历史
 * @param userInput 本轮用户输入
 */
export function buildGroveChat(
  grove: GroveData | null,
  history: { role: 'user' | 'ai'; content: string }[],
  userInput: string
): GrovePromptResult {
  // 1) system prompt
  let system = BASE_PERSONA
  if (grove) {
    system +=
      `\n\n当前用户正驻足在 "${grove.name}（${grove.subtitle}）" 林地。` +
      `\n这片林地的简介：${grove.description}` +
      `\n请优先围绕这种疾病作答；若用户提问与该病种无关，再做通用回答。`
  }

  // 2) 知识库召回：用本轮提问 + 林地名 共同检索，限制 3 条
  //    传入 diseaseId 让召回器在病种林地下强提权本病种条目、抑制其他病种串台
  const queryForRecall = grove ? `${grove.name} ${userInput}` : userInput
  const recalled = recallKb(queryForRecall, 3, grove?.id)
  const knowledge = recalled.map((it) => ({
    title: it.title,
    content: it.summary + '\n' + it.content,
  }))

  // 3) 拼装 messages：system + 历史 + 当前
  const messages: ChatMessage[] = [{ role: 'system', content: system }]
  for (const h of history) {
    messages.push({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content,
    })
  }
  messages.push({ role: 'user', content: userInput })

  return { messages, knowledge, recalled }
}

/**
 * C 端的预设关怀气泡（一键问），可以根据是否选中林地切换。
 */
export function getQuickPrompts(grove: GroveData | null): string[] {
  if (grove) {
    return [
      `${grove.name} 是什么样的疾病？`,
      `家人确诊了${grove.name}，我可以做些什么？`,
      `${grove.name} 有哪些救助渠道或基金？`,
      `${grove.name} 的日常照护要点有哪些？`,
    ]
  }
  return [
    '什么是罕见病？',
    '家人刚确诊我该怎么办？',
    '有哪些罕见病救助基金？',
    '我想找一位真人志愿者聊聊',
  ]
}
