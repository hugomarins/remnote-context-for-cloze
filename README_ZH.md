# Context for Cloze — 用户指南

让你在复习时，快速看清“当前卡片在知识结构中的位置”。本插件在复习队列中，于卡片下方显示一棵简洁的“上下文树”，帮助定位、联想与回顾；不更改卡片内容与复习调度。

## 功能介绍
- Context for Cloze（核心功能）
  - 在某个 Rem 上添加 Power‑Up“Context for Cloze”后（code：`contextForCloze`），该 Rem 的所有子代在复习成为题卡时，卡片下方会显示以该 Rem 为根的“上下文树”。
  - 题面阶段：上下文照常显示，但会避免泄露 cloze（填空）答案线索。
  - 答案阶段：继续显示上下文；被“揭示”的 cloze 以蓝色下划线和浅蓝背景作提示，便于对照与回顾。
- Context Hide Others（`contextHideAllTestOne`）——作用于**单个 Rem**，而非整棵子树。
  - 默认情况下，上下文树只隐藏你当前正在被测的那个填空；其他每一行的 cloze 都会显示揭示后的答案。当你不希望**某张卡片自己的复习**被其兄弟节点剧透时，给这张 cloze 卡片添加此 Power‑Up——在它被复习时，其他所有 cloze 答案将改为被遮挡（显示为 `…`）。
  - 应把它加在**会被剧透的那张 cloze 卡片 Rem（叶子节点）**上，而**不是**加在锚点/父级上。详见下文 [Context Hide Others](#context-hide-others保护会被兄弟节点剧透的-cloze-卡片)。
- 为 Rem 添加 Power‑Up 的方式
  - 命令：
    - Add Context for Cloze（快速码 `cfc`）
    - Context: Hide Other Answers for This Rem（快速码 `cfchide`）
  - 支持对多选 Rem 一次性添加。

## 与队列显示 power‑up 的兼容性
上下文树会与 RemNote 官方“Hide in Queue”插件**以及** Incremental Everything 插件的队列显示 power‑up 保持一致。本插件不注册其中任何一个——只在它们存在时读取其标记，因此某个 power‑up 未安装也不会有任何影响。

标记在条目自身：
- Hide in Queue（`hideInQueue`）
  - 在上下文树中显示占位文字“Hidden in queue”（仅题面阶段；答案阶段照常显示该条目）。
- Remove from Queue（`removeFromQueue`）
  - 在上下文树中完全移除此条目（题面/答案均不显示）。
- No Hierarchy（`noHierarchy`）
  - 当前题目带此标记时，上下文区域仅显示“当前题目这一行”，不显示祖先/兄弟/子孙，以保持与原生一致。

标记在卡片上、但作用于祖先（Incremental Everything）：
- Hide Parent（`hideParent`）/ Hide Grandparent（`hideGrandparent`）
  - 为卡片的父级 / 祖父级那一行显示“Hidden in queue”占位（仅题面阶段）。
- Remove Parent（`removeParent`）/ Remove Grandparent（`removeGrandparent`）
  - 在上下文树中完全移除卡片的父级 / 祖父级那一行（题面/答案均不显示）；其剩余子级保留并取消缩进。

无论带有上述哪种标记，当前卡片自己那一行始终显示。

## 默认折叠——按需展开
上下文树默认**折叠**显示：只展开通往当前卡片的那条分支，因此被测行始终可见，而更深的子级（常常会剧透或强烈暗示答案）保持隐藏。

- 含隐藏子级的行会以 **▸ 箭头**代替圆点；点击箭头（或聚焦后按 Enter/空格）即可展开该分支，展开后箭头朝下。
- 没有隐藏子级的行仍显示圆点。
- 展开状态按卡片重置：切换到下一张卡片时恢复默认。
- 想要旧的“始终全部展开”？在设置中关闭 **Start Collapsed** 即可。

## 眼睛与标记按钮——复习过程中切换 cloze 模式
上下文树中“其他行”的 cloze 有两种显示模式：**揭示**（蓝色下划线，默认）或**遮挡**（`…`，带 `Context Hide Others` 标记的卡片默认如此）。上下文区域**右上角的 👁 眼睛按钮**可为当前这张卡片在两种模式间切换。

- 眼睛**睁开** = 其他答案处于揭示状态，点击即可隐藏。
- 眼睛**带斜线** = 其他答案被遮挡为 `…`，点击即可揭示。
- 当揭示的答案泄露了你希望自己回忆出的线索时，可在阅读上下文树**之前**点击隐藏——无需先给 Rem 加标记。
- 当遮挡后的上下文树难以理解时（尤其是点击“Show Answer”**之后**），可点击揭示。
- 它本身不会修改知识库：标记仍决定初始模式，切换到下一张卡片时模式自动复位。
- 仅当确有其他行带 cloze 时按钮才会出现，否则没有可切换的内容。
- 遮挡模式下每个 `…` 仍可单独点击，因此也可以逐个揭示答案。

**让选择永久生效——🏷 标记按钮。** 当眼睛按钮切换出的模式与卡片当前标记不一致时，**眼睛左侧**会出现第二个按钮。点击它即可把该选择写入 Rem 本身，此后每次复习都以该模式开始：

- 普通标记图标 = 为该 Rem **添加** `Context Hide Others`（其他答案保持隐藏）。
- 带斜线的标记图标 = 从该 Rem **移除**该标记（其他答案保持揭示）。
- 悬停或聚焦任一按钮，同一行左侧会显示简短说明。
- 标记与当前显示一致后按钮即消失，并弹出提示确认。这是本插件唯一会写入知识库的操作。

## 配置项说明（Settings → Plugins → 本插件）
- Start Collapsed（默认开启）
  - 折叠显示上下文树，仅展开通往当前卡片的路径，其余分支收在可点击的 ▸ 箭头后。由于深层内容默认隐藏，开启后可放心调大 Max Depth。
- Max Depth（默认 8）
  - 限制上下文树的最大层级深度。层级较深、信息量较大时，可适当减小以提升可读性。
- Max Nodes（默认 200）
  - 限制上下文树的最多节点数量。层级分支较多时，可适当减小以避免信息过载。
- Debug Mode（默认关闭）
  - 在界面与控制台输出更多提示，便于排查（一般用户可保持关闭）。

## 使用方法
1. 选择一个 Rem 作为“上下文锚点”，为其添加 Power‑Up“Context for Cloze”（`contextForCloze`）。
2. 开始复习：当该锚点的任意子代成为题卡时，卡片下方会显示以锚点为根的“上下文树”。
3. 可选：如果某张 cloze 卡片会被其兄弟节点揭示的答案剧透，就给**这张卡片**添加“Context Hide Others”——运行 **Context: Hide Other Answers for This Rem**（`cfchide`）。详见下文专门章节。
4. 复习时点击 ▸ 箭头即可展开想看的分支，其余分支不会干扰回忆。
5. 当前模式不合适时，点击上下文区域右上角的 👁 按钮，即可揭示或隐藏其他行的 cloze 答案；若希望该选择长期生效，再点击它左侧的 🏷 按钮写入该 Rem。
6. 如有需要，在插件设置中调整 Max Depth / Max Nodes，以获得合适的信息密度。

## Context Hide Others——保护会被兄弟节点剧透的 cloze 卡片

**功能说明。** 默认情况下，本插件只隐藏你当前正在被测的那个填空。上下文树中其他每一个 cloze——包括兄弟节点以及任何其他 cloze 行——都会显示揭示后的答案（蓝色下划线），让周围的答案充当可见的上下文。

`Context Hide Others` 会为它所应用的那张卡片反转这一行为：当该卡片被复习时，树中**其他所有** cloze 行的答案改为被**遮挡**（显示为 `…`），而不再揭示。注意它与锚点标记的作用范围不同：`Context for Cloze` 加在子树的**根**上并影响全部子代，而本标记加在**单个 Rem** 上，只影响该 Rem 的复习；它也只决定**初始**模式，👁 按钮可随时为当前卡片切换。

无论是否添加此 Power‑Up，当前卡片自己那一行始终以 `?` 遮挡，而纯文本（非 cloze）上下文始终照常显示。此 Power‑Up 只改变*其他* cloze 的显示方式。

**加在哪里。**
- 应把它加在**会被兄弟节点剧透的那张 cloze 卡片 Rem（叶子节点）**上，也就是你希望保持“干净复习”的那张卡片。它不是分组标记：它只保护自己所在的这张卡片。
- **不要**把它加在承载 `Context for Cloze` 的锚点/父级上。该效果以“当前正在复习的卡片 Rem”为准，且不会沿树向下继承，因此加在父级上不会有任何作用。
- 保护是按卡片、单向生效的：给卡片 A 添加，只会让 **A 自己的**复习变干净，对 B、C 轮到时的显示毫无影响。所以当多张兄弟节点会互相剧透时，需要给**每一张**你想保护的卡片都添加——任何未添加的兄弟节点，在它自己复习时仍会揭示全部答案。
- 小技巧：选中所有你想保护的 cloze 卡片，再运行 **Context: Hide Other Answers for This Rem**（`cfchide`）——该命令支持多选，可一次性添加。

**何时使用。** 当某个父级下有多张兄弟 cloze 会在同时显示时互相剧透时使用——例如每一项都是独立 cloze 卡片的编号列表，或一组你想独立回忆的并列事实。如果周围的答案是你*希望*在回忆当前项时看到的合理上下文，则保持默认（不添加）。

### 当该 Rem 上方没有上下文锚点时
本标记只改变*上下文树*的显示方式，而上下文树只存在于带 `Context for Cloze` 标记的 Rem 之下。若某 Rem 上方没有这样的祖先，加了标记也毫无作用，因此该命令会先行检查。若缺少锚点，会弹出对话框说明情况并提供三个选项：

- **同时标记父级**——父级成为上下文锚点，所选 Rem 获得 `Context Hide Others`。对话框会显示该父级并预先说明后果：锚点会向下级联，此后该父级下的**每一张**卡片都会显示上下文树；同时报告该 Rem 有多少兄弟节点——上下文正由这些兄弟构成，若一个都没有，树会很单薄，更高层的祖先可能才是更合适的锚点。
- **仅标记该 Rem**——仍然添加标记，但在祖先成为锚点之前处于休眠状态。
- **取消**——不写入任何内容。

多选时，已位于锚点之下的 Rem 会立即被标记，对话框只询问其余的部分。

**逐个揭示被遮挡的 cloze（点击揭示）。** 当一张卡片以此方式受到保护时，每个被遮挡的 `…` 都是一个按钮。点击它（或聚焦后按 Enter/Space）即可就地揭示该 cloze 的答案；再次点击则收回为 `…`。这样你就能逐个、渐进地自评周围被隐藏的 cloze——即使它们并非当前被测的卡片。每个 `…` 独立开合，被测的填空本身始终保持隐藏（永远不会变成可点击），并且切换到下一张卡片时所有揭示都会自动重置。

## 提示
- 本插件仅在“复习队列”中显示；编辑器视图不受影响。
- 若当前卡片不在任何“Context for Cloze”锚点的子树内，则不会显示上下文。
- 与 No Hierarchy（`noHierarchy`）同时使用时，上下文将仅显示当前题目一行，这是设计预期。

## 示例截图

> 以下截图帮助你直观感受插件在实际复习中的呈现效果。

1) 测试用整体结构（上下文树示意）

![测试时使用的整体结构](https://remnote-user-data.s3.amazonaws.com/zaFqKpkiElkV2UIcTnEPlt0mr09fwkG0FV52yBVdzCJR6nTH0Lb6tEEgRIFht-oEINkdrK8wJF1K3G_VjYmWu-vohCE6RwAez_wvjvR6h-WtUPvVPYpyL0V6XdaGRRlJ.jpeg?loading=false)

2) 复习队列显示示例 A（题面阶段，防止线索泄露）

![复习队列显示示例 A](https://remnote-user-data.s3.amazonaws.com/GT9Ausv726feJf22kII7MJhnGCbfhVYFCh5GMtf2mUweNpSQUHn6dtmL0GWSTHzLVnyEJtZjCthc5Rda7aIJ-0eFMO2xhOO6dLqRrvm8SfEzl3FFF3zRx9qR8c0czX5g.jpeg)

3) 复习队列显示示例 B（答案阶段，cloze 高亮）

![复习队列显示示例 B](https://remnote-user-data.s3.amazonaws.com/bXoC-aeiey70Hl_jrjmS0MCUzN82TMPYUJF8KGy9iErqMqAQ-5dGy3UdqW4xbW2ezXFZg1uCgDnM4brRKA8Y0Doz87_VLLUZRS4C7i2t4qmCwVvvi8UZHp9MOaXhutc0.jpeg?loading=false)

- 说明： no hierarchy power up tag 和本插件的适配的演示

4) 复习队列显示示例 C（分支/层级对比）

![复习队列显示示例 C](https://remnote-user-data.s3.amazonaws.com/niJfC_INpPkpidUzOw6ZbY4r7e2bIXbK9zuVoCItDPPv3wv8qVl1b25OpTY8fWGC5JRr2jUHNN9TjOaQzuQwSc2qPqRFzBZRZHEY9vCmDJs-Lux3XYfBZapnr52ZEcyV.jpeg?loading=false)

5) 复习队列显示示例 D（不同内容类型的混排）

![复习队列显示示例 D](https://remnote-user-data.s3.amazonaws.com/j_FQj9RxuQnRqFO4X3Qo64siZY_3nHxoU4vQv-Hy1Op5OcAva_IuBPFlVA1EHAsjeywgP-wBHGrBUfjv82I2V-wJ409_IdO6AOJi8w8xHdIc8DfKH9zF9pjiskwoMlyf.jpeg?loading=false)

6) 复习队列显示示例 E（整体视感）

![复习队列显示示例 E](https://remnote-user-data.s3.amazonaws.com/rSRm6AeAIG7bsA1K74po0wdLr-cfbW9mGaA_Rkdp20qY2A54-2_W8kUy2Y4mkHls_K1CLnhR57677cGcIeBPdBSz_cmpDiTDlTN91M4r184lrhjKT4_f85OUoQ7qLG4h.jpeg?loading=false)

