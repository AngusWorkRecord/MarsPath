# 火星观察节点资料方案（审核稿）

核查日期：2026-11-15。范围：P1 核实、3 个新候选观察节点、开发数据交接。未修改现有 HTML、JS、CSS、路线或浏览器存档；本稿不代表已接入。

## 建议先审核的结论

第一版建议采用 **Hogwallow Flats 区域总览 → Skinner Ridge 岩层观察 → Wildcat Ridge 岩石比较**。三者是一个局部观察区的三级观察内容，并非三个互相独立、已经定位的远距离步行站。Skinner Ridge 与 Wildcat Ridge 的官方说明给出约 20 m 的相邻关系，但这不是路线长度或安全通行证明。[S4、S5、S11]

首个做完整资料卡的节点推荐 **Skinner Ridge**：有工作区景观、岩层、磨蚀斑和近照，适合复用“打开照片—标注—保存观察—完成任务”。不过，**可做资料卡不等于已经可以在地图上精确落点**。新节点当前全部禁止用随意填写的 X/Y 伪装真实定位。

NASA 的两个科学任务在本方案中承担不同角色：**MRO / HiRISE 提供俯视地貌与位置背景；Mars 2020 / Perseverance 提供 Mastcam-Z 地面影像、WATSON 近照与科学解释**。Mastcam-Z 与 WATSON 是同一任务的不同仪器，不算两个任务。现有 HRSC 图属于 ESA Mars Express，NASA 发布它不改变其任务归属。[S1、S3、S4、S7]

## 现有程序能复用什么

已阅读 mission.html、mission.js、DATA_SOURCES.md、MISSION_GUIDE.md，并核对 assets/SOURCES.md 及现有底图。

- 地图使用完整的 `assets/jezero-regional.jpg`，3300 × 2550 像素；SVG 视口为 1000 × 773。
- `photoLocations` 当前只有 P1：`x=600,y=330`；附近显示半径 120 是模拟单位。
- 图片标注 `state.mark` 是照片内归一化坐标；`state.observation` 与 `state.done` 只有一份，尚不能直接保存多个独立照片任务。
- C 点任务、N 点笔记、任务栏、暂停、返程及 TXT 日志可复用交互方式。当前 C 点完成主要依赖点击完成，不能视为已验证观察证据。
- 现有风险分数 25/65/48、危险椭圆、每段约 8 秒及 S1–S3 均没有真实环境数据依据，不能沿用为新节点的实测属性。
- DATA_SOURCES.md 仍写底图是 CSS 远程引用；实际 mission.html 已使用本地 img。开发时应同步修正文档，本轮保留原文件。

## P1：核实拍摄点和目标位置

**已核实**：PIA24485 为毅力号在 Octavia E. Butler Landing 拍摄的 Mastcam-Z 影像，采集日 2021-02-22；照片中部深棕色凸起为三角洲残余，官方说明它在着陆点以西约 2.3 km。2021-03-05 是发布日。官方把影像颜色描述为估计自然色。[S2]

**拍摄点与目标不是同一处**：地图上的真实相机节点应指着陆点；三角洲残余应另设 target，不应把相机标记放到三角洲上，也不应把 P1 自动替换成新候选区。现有 P1 照片的具名目标不能仅凭相似外形进一步命名为某一小丘。

可复核的位置证据链：

1. PIA24485 的图注直接写明相机所在的具名着陆点。[S2]
2. PIA24483 是 MRO/HiRISE 局部图，官方明确说明黄色星号就是该着陆点。项目内 `landing-site.jpg` 已使用这张图；1600 × 900 显示版本的星号中心目读约 `(776,569)`，即归一化 `(0.485,0.632)`。这是标注图中的星号读数，不是测量得到的相机姿态。[S3]
3. NASA NTRS 保存的 Bell 等（2022）原始研究，正文第 1 页给出着陆位置 **18.4446°N，77.4509°E**。这里只把它用作区域定位参考，不把小数位数解释为本程序的定位精度；与后续地图数据的纬度类型、参考框架还需核对。[S10]
4. 在现有区域 JPG 上目读：顶部 77°30′E 刻度约 x=1117，78°E 约 x=2389；右边 18°30′N 约 y=1035，18°N 约 y=2375。按这两组刻度作局部线性插值：

   `u ≈ 1117 + (77.4509-77.5)/0.5 × (2389-1117) ≈ 992 px`

   `v ≈ 1035 + (18.5-18.4446)/0.5 × (2375-1035) ≈ 1183 px`

   换到完整图像对应的 SVG：`x≈992/3300×1000≈301`，`y≈1183/2550×773≈359`。

因此，真实着陆点在现有大图上应大致位于 **左起约 30%、上起约 46%，三角洲东侧的坑底**，而不是当前 `(600,330)`。**建议展示用概略位置约 `(300,359)`，不能作为精确相机坐标直接提交程序。** 这是基于印刷刻度的目读插值，没有投影拟合、控制点残差或统计误差评估，不能承诺多少米的精度。[S1、S10；插值为本次推算]

P1 任务可保留“标出中景三角洲残余并描述形态”，完成要求：在照片内保存一个标记、说明“中景凸起/与前景碎石不同”至少一项，并记录“相机在着陆点，目标在西侧远处”。不要求用户凭该照片识别沉积物成分。

### 局部轨道图方案

- P1 卡先用 PIA24483：采用官方星号，不另造地理精度。保留北箭头、比例尺及署名。其采集时间与原始轨道产品 ID 未在图注中确定，不能把发布日当拍摄日。
- 新候选区用 **PIA24923**：官方 MRO/HiRISE 图标注 Hogwallow Flats 等区域及历史行驶轨迹；红星代表 **2022 年 9 月的车位**，不是 P1，也不能用来表示 2022 年 6 月地面照片的相机位置。[S4]
- 两张局部图先作为各自有 ID 的独立 map frame。区域大图只放局部区域入口；局部图上点位必须经过读图/控制点核查后再填写。第一版可以用“区域热点 → 两处岩石资料卡”的组合入口，避免两处相距约 20 m 的岩石在区域图上挤成假精确点。
- PIA24923 是带文字的展示图，不是已验证的 GIS 底图；它能支持具名区域关系，不能直接提供坡度、精确距离或足迹坐标。

## 候选节点对照表

| ID / 名称 | 定位依据与精度 | 俯视和地面资料 | 用户可认出什么 | 观察任务与完成标准 | 第一版建议 |
| --- | --- | --- | --- | --- | --- |
| N1 Hogwallow Flats / 浅色岩石区域总览 | PIA24923 的具名区域；PIA25672 说明拍摄对象。仅区域级，未核实相机经纬度、目标边界或地图像素 | MRO/HiRISE PIA24923；Perseverance/Mastcam-Z PIA25672 | 浅色露岩、表面覆盖差异；自然色与增强色表现差异 | 保存同一处露岩的两个版本标注，写出一项共同形态和一项色彩处理差异；注明增强色不能直接代表矿物 | 局部区域入口；与 N2/N3 有空间包含关系 |
| N2 Skinner Ridge / 岩层与粗颗粒观察 | PIA24924 Figure A 明确标出岩石目标；PIA24925 工作区及 PIA24926 左图交叉确认。目标级身份明确，绝对位置未核实 | 同一区域的 PIA24923；Mastcam-Z PIA24925；WATSON PIA24926 左图 | 景观中的层状岩石、人工磨蚀斑；近照中较明显的颗粒差异 | 在景观图标一条层界及磨蚀斑，再在近照标一个颗粒区域；保存两条观察和一条未知。证据齐全后确认完成 | **最适合先做完整资料卡** |
| N3 Wildcat Ridge / 细颗粒岩石比较 | PIA24924 Figure A 的另一标注目标，与 Skinner Ridge 约相距 20 m；PIA24928 及 PIA24926 右图确认。相对关系有依据，绝对坐标未核实 | 同一区域的 PIA24923；Mastcam-Z PIA24928；WATSON PIA24926 右图 | 磨蚀斑、取芯孔、相对细而均匀的纹理 | 标出磨蚀斑与一个取芯孔；和 N2 各保存一张证据图，写一句颗粒对比、一句“照片不能独立证明成分或生命” | 与 N2 配对，第二个完成 |

三项任务均为**教学设计**，不是 NASA 发布的宇航员操作规程。这里的“拍照”指在模拟中保存证据视图/截图及标注，不能声称生成了新的真实火星相机数据。

### N1 的拍摄元数据、环境判断与未知

PIA25672：2022-06-06，Sol 461，Mastcam-Z / Mars 2020。官方提供增强色及 Figure A 自然色，拍摄方位角及准确车位未核实。俯视图为 PIA24923 / MRO HiRISE，其发布日为 2022-09-15，轨道采集日待查。[S4、S7]

相机在当时的车位，**照片中的目标是 Hogwallow Flats 露岩区域**；不能用目标标签充当相机点。资料支持古代水下细颗粒沉积的科学解释；用户可以直接观察浅色露岩形态，但不能从颜色独立鉴定粒度或矿物。当前松软程度、承载力、坡度和可通行性未知。[S7]

### N2 的拍摄元数据、环境判断与未知

PIA24925：官方原文写 2022-06-30 至 07-08（PDT），Sols 484–492，Mastcam-Z；拼接图跨多日，不能赋一个虚构的单一 UTC 时刻/相机位姿。PIA24926 左图：2022-06-29，Sol 482，SHERLOC/WATSON，镜头距岩面约 7 cm。两者方位角未给出。[S5、S6]

相机分别是桅杆相机与机械臂相机的位置，目标是 Skinner Ridge 岩层/磨蚀面，不是同一个坐标。资料支持砂岩及水搬运碎屑的解释；细节图能做颗粒对比。来源判定、沉积环境解释来自任务团队，不能说由玩家一张 RGB 照片测出了岩石成分。绝对位置、层面倾角、岩块稳定性未知。[S5、S6]

### N3 的拍摄元数据、环境判断与未知

PIA24928：2022-08-04，Sol 518，Mastcam-Z，增强色；PIA24926 右图：2022-07-21，Sol 504，SHERLOC/WATSON，约 7 cm 近照。拍摄方位角及精确车位未给出。[S6、S8]

资料支持这里是比 N2 更细粒的含硫酸盐泥岩，以及与古代盐水环境有关的解释。2022 年 NASA 通报的 SHERLOC 分析是额外仪器证据，不是 WATSON 图像本身。若加入有机物说明，应写成“2022 年任务团队当时报告的解释”，不能写“已经发现生命”，也不把旧新闻自动当成全部后续研究结论。[S6、S9]

本版不安排实际取样。已有磨蚀面和取芯孔提供了选择这些岩石进行科学调查的依据，足够设计“识别历史采样痕迹、比较潜在调查价值”的任务；新增采样需要具体研究问题、目标层位、成分/粒度证据和避免混样等设计，不应只写“到点收集石头”。

## 原始页面、下载与署名清单

下列链接来自已打开的官方页面下载入口或仪器团队页面。这里收集的是接入清单，**尚未把新影像批量下载、缩放或检验解码**。大图访问可能超过预览服务大小限制，开发时应制作带来源记录的轻量衍生图。

| 键 | 产品、页面 | 下载地址 | 署名 / 日期说明 |
| --- | --- | --- | --- |
| S1 | [现有区域底图](https://www.jpl.nasa.gov/images/map-of-mars-jezero-crater/) | [JPG](https://d2pn8kiwq2w21t.cloudfront.net/original_images/Katie_1_-_DLR_Jezero_hi_v2.jpg) | ESA/DLR/FU Berlin/HRSC；发布 2025-09-10，采集日期未定 |
| S2 | [P1 / PIA24485](https://www.jpl.nasa.gov/images/pia24485-perseverance-view-of-the-delta-in-jezero-crater/) | [JPG](https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA24485.jpg) | NASA/JPL-Caltech/ASU/MSSS；采集 2021-02-22 |
| S3 | [着陆点 / PIA24483](https://www.jpl.nasa.gov/images/pia24483-welcome-to-octavia-e-butler-landing/) | [JPG](https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA24483.jpg) | NASA/JPL-Caltech/University of Arizona；发布 2021-03-05，采集日待查 |
| S4 | [三角洲前缘 / PIA24923](https://www.jpl.nasa.gov/images/pia24923-perseverance-exploring-the-front-of-the-delta/) | [JPG](https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA24923.jpg) | NASA/JPL-Caltech/University of Arizona/USGS；发布 2022-09-15，红星为该月历史车位 |
| S5 | [Skinner 工作区 / PIA24925](https://www.jpl.nasa.gov/images/pia24925-perseverance-workspace-at-skinner-ridge/) | [JPG](https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA24925.jpg) | NASA/JPL-Caltech/ASU/MSSS；多日拼接 |
| S6 | [两处磨蚀面 / PIA24926](https://science.nasa.gov/resource/two-abrasion-patches-from-perseverance-at-jezero-delta/) | [左 PNG](https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/downloadable_items/4/7/47549_PIA24926-LEFT.png?fit=clip&w=981) · [右 PNG](https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/downloadable_items/4/7/47553_PIA24926-RIGHT.png?fit=clip&w=981) · [JPL 合图 JPG](https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA24926.jpg) | NASA Science 分图页：NASA/JPL-Caltech/MSSS；JPL 合图页含 ASU，按实际采用版本署名，不强行统一 |
| S7 | [Hogwallow / PIA25672](https://www.jpl.nasa.gov/images/pia25672-perseverances-mastcam-z-views-hogwallow-flats/) | [增强色 JPG](https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA25672.jpg) · [自然色原始 PNG](https://mcz-images.sese.asu.edu/zcam_mosaics/CZCAM_SOL0461_ZCAM08482_Z110_L0_NN_SCI_CYL_HOGWALLOW_FLATS_LIGHT_TONED_SMITH_MOUNTAIN_01.png) | NASA/JPL-Caltech/ASU/MSSS；自然色文件来自 [ASU 仪器团队](https://mastcamz.asu.edu/galleries/sol-0461-hogwallow-flats-light-toned-smith-mountain-01-mastcam-z-mosaic/)，原图很大 |
| S8 | [Wildcat / PIA24928](https://www.jpl.nasa.gov/images/pia24928-sample-collection-and-rock-analysis-at-wildcat-ridge/) | [NASA JPG](https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia24/pia24928/PIA24928.jpg?fit=clip&w=3225) | NASA/JPL-Caltech/ASU/MSSS |
| S11 | [两目标共同场景 / PIA24924](https://www.jpl.nasa.gov/images/pia24924-2-perseverance-sampling-locations-in-jezeros-delta/) | [JPG](https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA24924.jpg) · [标注 Figure A](https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/downloadable_items/4/7/47572_PIA24924_two_sampling_locations_FigA.png?fit=clip&w=1920) | NASA/JPL-Caltech/ASU/MSSS；采集 2022-08-04 / Sol 518。**它是地面图，不能误标成轨道图。** |

文字与位置证据：

- S9：[NASA 2022 年地质调查通报](https://www.jpl.nasa.gov/news/nasas-perseverance-rover-investigates-geologically-rich-mars-terrain/)。仅用于有明确年代的科学背景，不沿用文中未来任务时间预测或样管“当前”位置。
- S10：[Bell 等（2022），NASA NTRS PDF](https://ntrs.nasa.gov/api/citations/20230016428/downloads/Bell%20et%20al%202022sciadv.pdf)，第 1 页正文着陆经纬度，图 1 区域背景。
- S12：[NASA 官方位置图入口](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/)。进一步查各采集 Sol 的历史车位；本轮未导出历史轨迹，也未用当前车位替代历史拍摄点。

部分 NASA 下载链接默认带 150×150 裁剪或缩略图 rendition；清单中的 dynamicimage 链接改为完整画幅缩放参数。开发下载后必须核查实际尺寸、未裁掉目标、颜色版本和标签，不能只凭 URL 成功就认定图像正确。

## 地形、环境与路线：分别需要什么证据

| 要判断的事 | 需要的数据与核查 | 本次状态 / 允许表达 |
| --- | --- | --- |
| 两地在哪里 | 地理参考轨道图、同参考框架的车位/目标定位、控制点 | P1 有区域概略定位；新节点具名区域/照片目标已对应，绝对坐标待核实 |
| 是否有岩层、碎石、露岩 | 轨道和地面图像，保留分辨率及光照背景 | 可做可见形态描述，不能用明暗直接推坡度 |
| 坡度多少 | 配准 DTM/DEM、投影单位、有效像元、垂直精度、计算窗口 | 未加载任何高程栅格，坡度全部未知 |
| 是否能走 | 坡度、粗糙度、障碍物、土壤/沙地性质及载具/宇航员能力 | 未验证。历史车辙只证明车在特定时候经过，不证明宇航员安全 |
| 危险程度 | 分别评估崩落、陷落、粉尘等所需证据和尺度 | 不产生真实危险区或风险分数 |
| 当前温度/风/气压/辐射 | 同时间、同地点或说明外推范围的相应测量 | 这些照片不提供当前环境读数；第一版留空 |

后续可查 HiRISE 正射图 + DTM，但不能见到“Jezero”就认定覆盖节点。本轮核查的 [ESP_048842_1985](https://www.uahirise.org/ESP_048842_1985) 及 [RED 标签](https://hirise-pds.lpl.arizona.edu/PDS/RDR/ESP/ORB_048800_048899/ESP_048842_1985/ESP_048842_1985_RED.LBL) 给出西边界约 77.458874°E，**着陆点 77.4509°E 已在该单张 RDR 边界之外**；因此不能把它选作覆盖 P1 和西侧节点的通用底图。其 [DTM 页面](https://www.uahirise.org/dtm/ESP_048842_1985) 虽列出 1 m/px 产品，也不能据此推定覆盖范围或垂直精度。建议开发下一阶段筛选更西侧影像/覆盖完整的正射镶嵌图，再实际检查范围和 NoData。

## 给开发会话的接入约定

配套文件 `observation-candidates.review.json` 是**审核数据草案**，没有被 mission.js 导入。

1. `uiAnchor`、`cameraPosition`、`targetPosition` 分开。P1 旧入口仅作为 legacy；约 `(300,359)` 放在概略区域提示字段，不能自动覆盖它。
2. 地理坐标包含参考框架/精度说明；无法确认时坐标或精度字段为 null。照片内标注统一为完整画幅归一化坐标，并保存 imageId，不能与地图坐标混用。
3. 候选 N1–N3 的 `uiAnchor` 均为空，开发不能直接用它们生成带地理含义的附近判断。可以先以区域资料列表呈现；完成图上落点核查后才启用位置触发。
4. 任务证据按 nodeId/taskId 独立存储；需要支持多幅图、多处标记、比较文字和未知项。现有单一 `state.mark/observation/done` 不够，后续要升级存档版本并迁移旧 P1。
5. 旧 `photoLocations[0]`、`near()` 和硬编码 P1 完成逻辑需改为按节点 ID 查找。任务栏可以保留外观，不能直接只把标题换掉就声称支持多节点。
6. 日志增加 nodeId、taskId、imageId、证据标记、资料拍摄日期与用户记录时间。两种时间分开；模拟行程继续标明不代表真实路程。
7. 暂不提供路线连线坐标、真实里程、预计 EVA 时间和“更安全”推荐。等节点注册和地形验证后另行设计；本轮推荐的是资料顺序。
8. 图像落地时记录原始 URL、产品 ID、下载时间、实际文件尺寸、哈希、衍生裁剪/缩放、色彩版本和署名。来源页面与下载链接都保留。

建议接入顺序：先做 Skinner Ridge 的独立证据卡，再加 Wildcat 比较，最后加 Hogwallow 总览与自然色/增强色切换；P1 保留为独立的着陆点远眺任务。先审核科学内容和这种空间层级，再开展下载和地图落点工作。
