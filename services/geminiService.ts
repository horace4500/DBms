import { GoogleGenAI, Type } from "@google/genai";
import { TextbookContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

// 本地化的教材内容字典 - 确保内容准确、加载迅速且为中文
const LOCAL_TEXTBOOK_CONTENT: Record<string, TextbookContent> = {
  '实体-联系模型 (ER Model)': {
    title: '实体-联系模型 (ER Model)',
    definition: '实体-联系模型（Entity-Relationship Model）是一种概念模型，用于对现实世界进行抽象和建模。它通过“实体”、“属性”和“联系”三个基本概念来描述数据及其相互关系，是数据库设计中概念设计阶段的主要工具。',
    keyPoints: [
      '核心要素：实体 (Entity)、属性 (Attribute)、联系 (Relationship)。',
      '图形表示：实体用矩形，属性用椭圆，联系用菱形。',
      '用途：将现实世界的业务需求转换为直观的图形化模型，便于开发人员与用户沟通。'
    ],
    example: '【场景：教务管理系统】\n在设计学校教务系统时，我们需要记录谁在教书、谁在听课。我们首先识别出“教师”和“学生”作为主要实体。然后，我们发现它们之间通过“授课”这一行为产生关联。最终的ER模型不仅包含这两个实体，还通过一个名为“授课”的菱形联系将它们连接起来，直观地展示了业务逻辑，而不是过早陷入具体的表结构设计。'
  },
  '实体 (Entity)': {
    title: '实体 (Entity)',
    definition: '实体是指客观存在并可相互区别的事物。实体可以是具体的人、事、物（如一本书、一名学生），也可以是抽象的概念（如一次比赛、一门课程）。',
    keyPoints: [
      '实体集：具有相同属性的实体集合（如所有学生组成的集合）。',
      '表示方法：在ER图中用矩形框表示，框内写明实体名。',
      '唯一标识：每个实体必须有一个能唯一区分它的属性（即主键）。'
    ],
    example: '【场景：电商订单系统】\n1. 具体实体：“iPhone 15 Pro Max (256G 黑色)”是“商品”实体集中的一个具体实例。在ER图中，我们画一个矩形框，里面写上“商品”。\n2. 抽象实体：“双十一大促”可以是“营销活动”实体集的一个实例。即使它看不见摸不着，但在业务中需要记录它的开始时间、结束时间和优惠规则，所以它也是一个实体。'
  },
  '属性 (Attribute)': {
    title: '属性 (Attribute)',
    definition: '属性是实体所具有的某一特性，用于描述实体的细节。一个实体可以由若干个属性来刻画。',
    keyPoints: [
      '表示方法：在ER图中用椭圆形表示，并用无向边将其与相应的实体连接。',
      '分类：简单属性与复合属性；单值属性与多值属性；派生属性等。',
      '主属性：能唯一标识实体的属性（通常在文字描述中加下划线）。'
    ],
    example: '【场景：用户画像】\n对于“用户”这个实体，我们需要采集详细信息来描绘它。我们会在“用户”矩形周围画出多个椭圆：\n- “用户ID”：这是主属性，用于唯一区分不同用户。\n- “昵称”、“头像URL”：这是描述性属性。\n- “出生日期”：这是存储属性。\n- “年龄”：这是派生属性，因为它可以根据“出生日期”和当前日期计算得出，通常在物理设计时为了性能才冗余存储，但在概念设计中它是派生的。'
  },
  '关系 (Relationship)': {
    title: '关系 (Relationship)',
    definition: '关系（或联系）是指实体集之间的对应关系，反映了现实世界中事物之间的相互作用或关联。',
    keyPoints: [
      '表示方法：在ER图中用菱形框表示，框内写明关系名。',
      '度数：参与关系的实体集个数（如二元关系、三元关系）。',
      '关系属性：关系本身也可以拥有属性（如选修关系中的“成绩”）。'
    ],
    example: '【场景：项目管理】\n“工程师”和“项目”是两个实体。一个工程师参与一个项目，这之间就存在“参与”关系。\n值得注意的是，关系也可以有属性。例如，工程师是什么时候加入这个项目的？“加入时间”这个属性既不完全属于工程师（因为他可能不同时间加入不同项目），也不属于项目。它属于“工程师参与项目”这个关系本身。在ER图中，我们会把“加入时间”这个椭圆连接到“参与”这个菱形上。'
  },
  '一对一关系 (1:1)': {
    title: '一对一关系 (1:1)',
    definition: '如果实体集A中的每一个实体，最多只能和实体集B中的一个实体有联系，反之亦然，则称实体集A与实体集B具有一对一联系。',
    keyPoints: [
      '记号：在连线上标记 "1" 和 "1"。',
      '实际应用：相对较少，常用于将大表拆分或表示特殊的从属关系。',
      '数据库转化：通常将一方的主键加入另一方作为外键，或者合并成一张表。'
    ],
    example: '【场景：公司资产管理】\n假设公司规定“每位经理专用一台笔记本电脑”，且“每台笔记本电脑只能分配给一位经理”。\n这构成了典型的 1:1 关系。在数据库设计时，我们通常不会为此建立三张表。我们可以在“笔记本电脑”表中增加一个“使用经理ID”的列，或者在“经理”表中增加一个“分配电脑ID”的列，从而在物理层面简化这种紧密的联系。'
  },
  '一对多关系 (1:N)': {
    title: '一对多关系 (1:N)',
    definition: '如果实体集A中的每一个实体，可以与实体集B中的多个实体有联系；但实体集B中的每一个实体，最多只能和实体集A中的一个实体有联系，则称实体集A与实体集B具有一对多联系。',
    keyPoints: [
      '记号：在“一”的一方连线上标记 "1"，在“多”的一方连线上标记 "N"。',
      '普遍性：这是最常见的关系类型。',
      '数据库转化：将“1”方的主键作为外键添加到“N”方的表中。'
    ],
    example: '【场景：班级与学生】\n一个“班级”可以包含几十名“学生”，但一名“学生”行政上只能隶属于一个“班级”。\n这就是 1:N 关系。在数据库实现时，我们不仅不需要建立中间表，反而规则非常简单：只要在“学生”表中增加一个“所属班级ID”列即可。这体现了“多方维护外键”的原则。'
  },
  '多对多关系 (M:N)': {
    title: '多对多关系 (M:N)',
    definition: '如果实体集A中的每一个实体，可以与实体集B中的多个实体有联系；并且实体集B中的每一个实体，也可以与实体集A中的多个实体有联系，则称实体集A与实体集B具有多对多联系。',
    keyPoints: [
      '记号：在连线两端分别标记 "M" 和 "N"。',
      '数据库转化：必须转换为一个独立的关联表（中间表），该表包含双方的主键。',
      '关系属性：多对多关系常带有属性（如学生选课的“成绩”）。'
    ],
    example: '【场景：图书借阅系统】\n一名“读者”可以借阅多本“图书”；一本“图书”在其生命周期内也可以被多名“读者”借阅。\n这是 M:N 关系。在转化为数据库表时，我们无法仅通过修改读者表或图书表来记录这种关系。必须创建一张新表——“借阅记录表”。这张表至少包含：读者ID、图书ID、以及借阅日期。这展示了多对多关系在物理模型中如何“实体化”。'
  }
};

export const fetchExplanation = async (topic: string): Promise<TextbookContent> => {
  // 1. 优先使用本地化的精准教材内容
  if (LOCAL_TEXTBOOK_CONTENT[topic]) {
    // 模拟微小的延迟以平滑UI过渡
    return new Promise((resolve) => {
        setTimeout(() => resolve(LOCAL_TEXTBOOK_CONTENT[topic]), 100);
    });
  }

  // 2. 如果请求未知的主题，则回退到 AI 生成
  const prompt = `
    作为《数据库基础与应用》课程的资深教授，请为初学者解释"${topic}"这一概念。
    请务必使用中文回复。
    请以结构化的JSON格式返回，包含定义、关键点（数组）和具体的教学示例。
    定义应当严谨，符合学术规范。
    示例应当生动易懂。
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            definition: { type: Type.STRING },
            keyPoints: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            example: { type: Type.STRING }
          },
          required: ["title", "definition", "keyPoints", "example"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TextbookContent;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: topic,
      definition: "无法获取AI讲解，请检查网络连接。",
      keyPoints: ["请稍后重试"],
      example: "无"
    };
  }
};

export const generateScenario = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: "生成一个简短的ER图绘制练习题，描述一个简单的业务场景（如：图书管理、选课系统、电商订单）。请使用中文。不超过50个字。请直接返回题目内容。",
        });
        return response.text || "请设计一个学生选课系统的ER图。";
    } catch (e) {
        return "请设计一个简单的班级管理系统ER图。";
    }
}