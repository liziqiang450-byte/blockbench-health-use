/**
 * 健康使用 Blockbench (Health Use Blockbench)
 * ------------------------------------------------------------
 * 统计 Blockbench 使用时长，并按"建模 / 贴图绘画 / 动画制作 / 其它"四类分桶，
 * 提供"健康使用手机"风格的可视化面板、趣味时长评级与人工费计算器。
 *
 * 目标版本：Blockbench 5.1.x 桌面版（min_version 5.1.0）
 * 数据：纯本地 localStorage，不上传；支持 JSON 导出/导入（合并）。
 * 作者：本地自用插件（按需求文档 v0.1 实现）
 */
(function () {
	'use strict';

	const PLUGIN_ID = 'health_use_blockbench';
	const PLUGIN_VERSION = '1.6.0';
	const BUILD_STAMP = '2026-11-02 03:55';
	const STORAGE_KEY = 'hubb_data_v1';
	const REPO_GITHUB = 'https://github.com/liziqiang450-byte/blockbench-health-use';
	const REPO_GITEE = 'https://gitee.com/hgx100/blockbench-health-use';
	const FEEDBACK_URL = REPO_GITHUB + '/issues';

	const CATS = ['model', 'texture', 'animate', 'other'];
	const CAT_COLOR = { model: '#4a9eff', texture: '#38c172', animate: '#f6993f', other: '#8e9aaf' };
	const CATEGORY_ORDER = ['model', 'texture', 'animate', 'other'];

	// 模式 -> 分类（v5 内置模式只有 edit / paint / animate / display / pose）
	const MODE_CATEGORY = {
		edit: 'model',
		paint: 'texture',
		pose: 'texture',   // 皮肤作者主战场：pose + paint
		animate: 'animate',
		display: 'other',
		// 未知/插件注册的模式一律进"其它"
	};

	// ------------------------------------------------------------
	// 多语言（简体中文 / 繁體中文 / English）
	// ------------------------------------------------------------
	const LANGUAGES = ['zh-cn', 'zh-tw', 'en'];

	const I18N = {
		'zh-cn': {
			'panel.title': '健康使用 Blockbench',
			'action.name': '健康使用 Blockbench',
			'action.desc': '查看使用时长、评级与人工费',
			'plugin.description': '像「健康使用手机」一样统计建模/贴图/动画时长，提供可视化面板、使用趋势、时长评级与人工费计算器。',
			'plugin.about': '本插件为纯 Vibe Coding 作品，powered by DeepSeek。\n\n数据只保存在本机，不上传。\n\n反馈 / 联系：哔哩哔哩 @圣起司（https://space.bilibili.com/18095414）\nGitHub：https://github.com/liziqiang450-byte/blockbench-health-use\nGitee：https://gitee.com/hgx100/blockbench-health-use',
			'ratingDialog.title': '评级标准',
			'clear.title': '清空使用数据',
			'clear.message': '确定要清空「健康使用 Blockbench」的全部本地统计数据吗？\n\n此操作不可撤销，建议先导出 JSON 备份。',
			'clear.cancel': '取消',
			'clear.confirm': '确认清空',
			'lang.auto': '自动（跟随 Blockbench）',
			'lang.zh-cn': '简体中文',
			'lang.zh-tw': '繁體中文',
			'lang.en': 'English',
			'cat.model': '建模',
			'cat.texture': '贴图绘画',
			'cat.animate': '动画制作',
			'cat.other': '其它',
			'today.bigLabel': '今日使用（不含挂机）',
			'today.categories': '今日分类',
			'today.idle': '挂机 {time}（窗口在前台但无操作，不计入评级与人工费）',
			'rating.viewStandard': '查看完整评级标准',
			'rating.tag.sitting': '久坐警告',
			'rating.tag.nightOwl': '夜猫子',
			'rating.tag.tomorrowOff': '明日请假',
			'help.today': '条形长度 = 该分类占今日总时长的比例（不含挂机）；右侧是具体时长和百分比。挂机（窗口在前台但长时间无操作）单独统计，不计入评级与人工费。',
			'help.rating': '今日使用时长 = 当天建模 + 贴图 + 动画 + 其它（不含挂机）。评级按今日总时长分档；标签由连续使用时长、深夜占比自动生成。点评级徽章或设置里的 ? 可查看完整标准。',
			'help.trend': '最近 7 天：每天一根四色堆叠柱，柱高按当周最高一天归一，颜色为四类占比。日历：每格显示当天总时长 + 四类占比小色条，安装日之前显示"数据暂缺"。每日曲线：自安装日起每天的时长折线，可切近 30 天 / 全部。',
			'help.project': '当前项目 = 当前选中的 .bbmodel（按保存路径识别，未保存项目随会话）。时长为四类累计。人工费 = Σ(分类时长 × 实际费率)，实际费率优先用分类费率，其次本项目时薪，最后全局时薪；再按取整规则与最低收费修正。',
			'help.ranking': '按累计时长排序的前 10 个项目；人工费按各项目自己的时薪 / 分类费率计算。名称后的灰字是模型的标识符（model_identifier）。未保存的新项目会以"未命名项目"出现，30 天后自动清理。',
			'help.settings': '时薪 / 分类费率（留空=回退到项目时薪→全局时薪）、空闲判定阈值、评级风格、费用取整规则、最低收费、"其它"是否计费、界面语言。修改后立即保存到本机。',
			'help.button': '查看说明',
			'trend.title': '使用趋势',
			'trend.week': '最近 7 天',
			'trend.calendar': '日历',
			'trend.history': '每日曲线',
			'trend.weekSum': '近 7 天合计 {time}',
			'trend.weekNote': '柱高按当周最高一天归一，颜色为四类占比',
			'trend.range30': '近 30 天',
			'trend.rangeAll': '全部',
			'trend.installNote': '安装日 {date} 之前的数据暂缺',
			'trend.empty': '还没有可展示的历史。',
			'calendar.prev': '上个月',
			'calendar.next': '下个月',
			'calendar.month': '{y} 年 {m} 月',
			'calendar.missing': '数据暂缺',
			'calendar.missingDetail': '：数据暂缺（早于安装日）',
			'calendar.futureDetail': '：尚未到来',
			'calendar.sep': '：',
			'calendar.missingTip': '：数据暂缺（早于安装日）',
			'calendar.futureTip': '：尚未到来',
			'week.today': '今天',
			'dow.mon': '一',
			'dow.tue': '二',
			'dow.wed': '三',
			'dow.thu': '四',
			'dow.fri': '五',
			'dow.sat': '六',
			'dow.sun': '日',
			'project.title': '当前项目：',
			'project.untitled': '未命名项目',
			'project.empty': '还没有打开项目：这段时间会计入「其它」，不归属到任何项目。',
			'project.rateLabel': '本项目时薪',
			'project.ratePlaceholder': '留空用全局',
			'project.rateHint': '留空 = 全局 {rate}/h（分类费率优先）',
			'project.cost': '人工费',
			'ranking.title': '项目排行',
			'ranking.count': '（共 {count} 个）',
			'ranking.empty': '还没有累计数据。',
			'settings.title': '设置',
			'settings.language': '界面语言',
			'settings.hourly': '时薪（元/小时）',
			'settings.currency': '货币符号',
			'settings.idle': '空闲判定',
			'settings.ratingStyle': '评级风格',
			'settings.ratingFun': '玩梗',
			'settings.ratingSerious': '严肃健康提示',
			'settings.rounding': '费用取整',
			'settings.roundMinute': '按分钟精确',
			'settings.roundHalfHour': '按 0.5h 向上取整',
			'settings.roundHour': '按 1h 向上取整',
			'settings.minFee': '最低收费（元）',
			'settings.otherBillable': '「其它」时间计入人工费',
			'settings.rateModel': '建模费率（留空=全局）',
			'settings.rateTexture': '贴图费率（留空=全局）',
			'settings.rateAnimate': '动画费率（留空=全局）',
			'settings.rateOther': '「其它」费率（留空=全局）',
			'settings.ratePlaceholder': '留空',
			'buttons.export': '导出 JSON',
			'buttons.import': '导入 JSON（合并）',
			'buttons.copyQuote': '复制报价单',
			'buttons.clear': '清空数据',
			'footer.storage': '数据只保存在本机（localStorage），不上传',
			'footer.version': 'v{v} · 构建 {stamp}',
			'footer.powered': 'Powered by DeepSeek',
			'footer.sep': '，',
			'footer.creditPrefix': '点子提供者：',
			'footer.creditName': '哔哩哔哩@圣起司',
			'footer.feedback': '问题反馈',
			'idle.60': '1 分钟无操作',
			'idle.120': '2 分钟无操作（推荐）',
			'idle.300': '5 分钟无操作',
			'idle.600': '10 分钟无操作',
			'idle.0': '不判定（窗口在前台就算）',
			'rating.fun.0.title': '摸鱼新星',
			'rating.fun.0.desc': '今天才刚开始，先热热身。',
			'rating.fun.1.title': '小试牛刀',
			'rating.fun.1.desc': '手感回来了，继续保持。',
			'rating.fun.2.title': '稳步推进',
			'rating.fun.2.desc': '节奏不错，每 90 分钟记得起来活动一下。',
			'rating.fun.3.title': '全职选手',
			'rating.fun.3.desc': '已经是正经工作量了，别忘喝水。',
			'rating.fun.4.title': '肝帝',
			'rating.fun.4.desc': '产能很高，但别硬撑，眼睛需要休息。',
			'rating.fun.5.title': '另类上班',
			'rating.fun.5.desc': '这已经是一份全职工作了，注意颈椎。',
			'rating.fun.6.title': '通宵预备役',
			'rating.fun.6.desc': '今天该收手了，明天还要继续。',
			'rating.serious.0.title': '轻度使用',
			'rating.serious.0.desc': '今天使用较少，注意保持规律作息。',
			'rating.serious.1.title': '正常范围',
			'rating.serious.1.desc': '使用时长正常，每小时起身活动 1-2 分钟。',
			'rating.serious.2.title': '偏长',
			'rating.serious.2.desc': '连续使用已偏长，建议每 60 分钟休息 5 分钟。',
			'rating.serious.3.title': '较长',
			'rating.serious.3.desc': '长时间保持同一姿势，注意肩颈与视力。',
			'rating.serious.4.title': '过久',
			'rating.serious.4.desc': '已超过多数人的单日使用时长，建议尽快安排休息。',
			'rating.serious.5.title': '超负荷',
			'rating.serious.5.desc': '长时间高强度使用，建议今天停止并保证睡眠。',
			'rating.serious.6.title': '严重超负荷',
			'rating.serious.6.desc': '请立即停止工作，长时间使用会显著增加健康风险。',
			'ratingDialog.intro': '评级按 <b>今日使用时长</b>（建模 + 贴图 + 动画 + 其它，不含挂机）分档：',
			'ratingDialog.colRange': '今日累计',
			'ratingDialog.colFun': '玩梗模式',
			'ratingDialog.colSerious': '严肃模式',
			'ratingDialog.tags': '附加标签：连续使用 ≥ 90 分钟 → <b>久坐警告</b>；23:00–05:00 使用占比 &gt; 30% → <b>夜猫子</b>；单日 ≥ 8h 且深夜 ≥ 1h → <b>明日请假</b>。',
			'ratingDialog.note': '评级风格可在设置里切换；分档阈值目前固定，后续版本可做成可配置。',
			'quote.header': '【Blockbench 工时报价】',
			'quote.project': '项目：{name}',
			'quote.line': '{label}：{time}（{rate}/h）',
			'quote.lineOther': '其它：{time}（{rate}/h，{state}）',
			'quote.billable': '计费时长：{time}',
			'quote.hourly': '时薪：{rate}/h',
			'quote.rates': '费率：{rates}',
			'quote.total': '人工费：{money}',
			'quote.time': '统计时间：{time}',
			'quote.footer': '（数据来自「健康使用 Blockbench」本地统计）',
			'quote.included': '计入',
			'quote.excluded': '不计入',
			'toast.exported': '已导出：{path}',
			'toast.exportFail': '导出失败：{err}',
			'toast.importDone': '导入完成（合并）：{days} 天 / {projects} 个项目',
			'toast.importFail': '导入失败：{err}',
			'toast.cleared': '已清空本地统计数据',
			'toast.copied': '报价单已复制到剪贴板',
			'toast.copyFail': '复制失败，请手动选择文本复制',
			'toast.noProject': '当前没有打开项目，无法生成报价单',
			'toast.badFormat': '文件内容不是有效的数据格式',
			'toast.notOurs': '不是「健康使用 Blockbench」导出的文件',
			'toast.noData': '文件里没有可导入的数据',
		},
		'zh-tw': {
			'panel.title': '健康使用 Blockbench',
			'action.name': '健康使用 Blockbench',
			'action.desc': '檢視使用時長、評級與人工費',
			'plugin.description': '像「健康使用手機」一樣統計建模/貼圖/動畫時長，提供視覺化面板、使用趨勢、時長評級與人工費計算器。',
			'plugin.about': '本外掛為純 Vibe Coding 作品，powered by DeepSeek。\n\n資料只保存在本機，不上傳。\n\n回饋 / 聯絡：嗶哩嗶哩 @圣起司（https://space.bilibili.com/18095414）\nGitHub：https://github.com/liziqiang450-byte/blockbench-health-use\nGitee：https://gitee.com/hgx100/blockbench-health-use',
			'ratingDialog.title': '評級標準',
			'clear.title': '清除使用資料',
			'clear.message': '確定要清除「健康使用 Blockbench」的全部本機統計資料嗎？\n\n此操作無法復原，建議先匯出 JSON 備份。',
			'clear.cancel': '取消',
			'clear.confirm': '確認清除',
			'lang.auto': '自動（跟隨 Blockbench）',
			'lang.zh-cn': '简体中文',
			'lang.zh-tw': '繁體中文',
			'lang.en': 'English',
			'cat.model': '建模',
			'cat.texture': '貼圖繪畫',
			'cat.animate': '動畫製作',
			'cat.other': '其他',
			'today.bigLabel': '今日使用（不含掛機）',
			'today.categories': '今日分類',
			'today.idle': '掛機 {time}（視窗在前景但無操作，不計入評級與人工費）',
			'rating.viewStandard': '檢視完整評級標準',
			'rating.tag.sitting': '久坐警告',
			'rating.tag.nightOwl': '夜貓子',
			'rating.tag.tomorrowOff': '明日請假',
			'help.today': '條形長度 = 該分類佔今日總時長的比例（不含掛機）；右側是具體時長和百分比。掛機（視窗在前景但長時間無操作）單獨統計，不計入評級與人工費。',
			'help.rating': '今日使用時長 = 當天建模 + 貼圖 + 動畫 + 其他（不含掛機）。評級按今日總時長分檔；標籤由連續使用時長、深夜佔比自動產生。點評級徽章或設定裡的 ? 可檢視完整標準。',
			'help.trend': '最近 7 天：每天一根四色堆疊柱，柱高按當週最高一天歸一，顏色為四類佔比。行事曆：每格顯示當天總時長 + 四類佔比小色條，安裝日之前顯示「資料暫缺」。每日曲線：自安裝日起每天的時長折線，可切近 30 天 / 全部。',
			'help.project': '目前專案 = 目前選取的 .bbmodel（按儲存路徑識別，未儲存專案隨工作階段）。時長為四類累計。人工費 = Σ(分類時長 × 實際費率)，實際費率優先使用分類費率，其次本專案時薪，最後全域時薪；再按取整規則與最低收費修正。',
			'help.ranking': '按累計時長排序的前 10 個專案；人工費按各專案自己的時薪 / 分類費率計算。名稱後的灰字是模型的識別碼（model_identifier）。未儲存的新專案會以「未命名專案」出現，30 天後自動清除。',
			'help.settings': '時薪 / 分類費率（留空=退回專案時薪→全域時薪）、空閒判定門檻、評級風格、費用取整規則、最低收費、「其他」是否計費、介面語言。修改後立即儲存到本機。',
			'help.button': '檢視說明',
			'trend.title': '使用趨勢',
			'trend.week': '最近 7 天',
			'trend.calendar': '行事曆',
			'trend.history': '每日曲線',
			'trend.weekSum': '近 7 天合計 {time}',
			'trend.weekNote': '柱高按當週最高一天歸一，顏色為四類佔比',
			'trend.range30': '近 30 天',
			'trend.rangeAll': '全部',
			'trend.installNote': '安裝日 {date} 之前的資料暫缺',
			'trend.empty': '還沒有可顯示的歷史。',
			'calendar.prev': '上個月',
			'calendar.next': '下個月',
			'calendar.month': '{y} 年 {m} 月',
			'calendar.missing': '資料暫缺',
			'calendar.missingDetail': '：資料暫缺（早於安裝日）',
			'calendar.futureDetail': '：尚未到來',
			'calendar.sep': '：',
			'calendar.missingTip': '：資料暫缺（早於安裝日）',
			'calendar.futureTip': '：尚未到來',
			'week.today': '今天',
			'dow.mon': '一',
			'dow.tue': '二',
			'dow.wed': '三',
			'dow.thu': '四',
			'dow.fri': '五',
			'dow.sat': '六',
			'dow.sun': '日',
			'project.title': '目前專案：',
			'project.untitled': '未命名專案',
			'project.empty': '還沒有開啟專案：這段時間會計入「其他」，不歸屬到任何專案。',
			'project.rateLabel': '本專案時薪',
			'project.ratePlaceholder': '留空用全域',
			'project.rateHint': '留空 = 全域 {rate}/h（分類費率優先）',
			'project.cost': '人工費',
			'ranking.title': '專案排行',
			'ranking.count': '（共 {count} 個）',
			'ranking.empty': '還沒有累計資料。',
			'settings.title': '設定',
			'settings.language': '介面語言',
			'settings.hourly': '時薪（元/小時）',
			'settings.currency': '貨幣符號',
			'settings.idle': '空閒判定',
			'settings.ratingStyle': '評級風格',
			'settings.ratingFun': '玩梗',
			'settings.ratingSerious': '嚴肅健康提示',
			'settings.rounding': '費用取整',
			'settings.roundMinute': '按分鐘精確',
			'settings.roundHalfHour': '按 0.5h 向上取整',
			'settings.roundHour': '按 1h 向上取整',
			'settings.minFee': '最低收費（元）',
			'settings.otherBillable': '「其他」時間計入人工費',
			'settings.rateModel': '建模費率（留空=全域）',
			'settings.rateTexture': '貼圖費率（留空=全域）',
			'settings.rateAnimate': '動畫費率（留空=全域）',
			'settings.rateOther': '「其他」費率（留空=全域）',
			'settings.ratePlaceholder': '留空',
			'buttons.export': '匯出 JSON',
			'buttons.import': '匯入 JSON（合併）',
			'buttons.copyQuote': '複製報價單',
			'buttons.clear': '清除資料',
			'footer.storage': '資料只儲存在本機（localStorage），不上傳',
			'footer.version': 'v{v} · 建置 {stamp}',
			'footer.powered': 'Powered by DeepSeek',
			'footer.sep': '，',
			'footer.creditPrefix': '點子提供者：',
			'footer.creditName': '嗶哩嗶哩@圣起司',
			'footer.feedback': '問題回饋',
			'idle.60': '1 分鐘無操作',
			'idle.120': '2 分鐘無操作（推薦）',
			'idle.300': '5 分鐘無操作',
			'idle.600': '10 分鐘無操作',
			'idle.0': '不判定（視窗在前景就算）',
			'rating.fun.0.title': '摸魚新星',
			'rating.fun.0.desc': '今天才剛開始，先熱熱身。',
			'rating.fun.1.title': '小試牛刀',
			'rating.fun.1.desc': '手感回來了，繼續保持。',
			'rating.fun.2.title': '穩步推進',
			'rating.fun.2.desc': '節奏不錯，每 90 分鐘記得起來活動一下。',
			'rating.fun.3.title': '全職選手',
			'rating.fun.3.desc': '已經是正經工作量了，別忘喝水。',
			'rating.fun.4.title': '肝帝',
			'rating.fun.4.desc': '產能很高，但別硬撐，眼睛需要休息。',
			'rating.fun.5.title': '另類上班',
			'rating.fun.5.desc': '這已經是一份全職工作了，注意頸椎。',
			'rating.fun.6.title': '通宵預備役',
			'rating.fun.6.desc': '今天該收手了，明天還要繼續。',
			'rating.serious.0.title': '輕度使用',
			'rating.serious.0.desc': '今天使用較少，注意保持規律作息。',
			'rating.serious.1.title': '正常範圍',
			'rating.serious.1.desc': '使用時長正常，每小時起身活動 1-2 分鐘。',
			'rating.serious.2.title': '偏長',
			'rating.serious.2.desc': '連續使用已偏長，建議每 60 分鐘休息 5 分鐘。',
			'rating.serious.3.title': '較長',
			'rating.serious.3.desc': '長時間保持同一姿勢，注意肩頸與視力。',
			'rating.serious.4.title': '過久',
			'rating.serious.4.desc': '已超過多數人的單日使用時長，建議盡快安排休息。',
			'rating.serious.5.title': '超負荷',
			'rating.serious.5.desc': '長時間高強度使用，建議今天停止並保證睡眠。',
			'rating.serious.6.title': '嚴重超負荷',
			'rating.serious.6.desc': '請立即停止工作，長時間使用會顯著增加健康風險。',
			'ratingDialog.intro': '評級按 <b>今日使用時長</b>（建模 + 貼圖 + 動畫 + 其他，不含掛機）分檔：',
			'ratingDialog.colRange': '今日累計',
			'ratingDialog.colFun': '玩梗模式',
			'ratingDialog.colSerious': '嚴肅模式',
			'ratingDialog.tags': '附加標籤：連續使用 ≥ 90 分鐘 → <b>久坐警告</b>；23:00–05:00 使用佔比 &gt; 30% → <b>夜貓子</b>；單日 ≥ 8h 且深夜 ≥ 1h → <b>明日請假</b>。',
			'ratingDialog.note': '評級風格可在設定裡切換；分檔門檻目前固定，後續版本可做成可設定。',
			'quote.header': '【Blockbench 工時報價】',
			'quote.project': '專案：{name}',
			'quote.line': '{label}：{time}（{rate}/h）',
			'quote.lineOther': '其他：{time}（{rate}/h，{state}）',
			'quote.billable': '計費時長：{time}',
			'quote.hourly': '時薪：{rate}/h',
			'quote.rates': '費率：{rates}',
			'quote.total': '人工費：{money}',
			'quote.time': '統計時間：{time}',
			'quote.footer': '（資料來自「健康使用 Blockbench」本機統計）',
			'quote.included': '計入',
			'quote.excluded': '不計入',
			'toast.exported': '已匯出：{path}',
			'toast.exportFail': '匯出失敗：{err}',
			'toast.importDone': '匯入完成（合併）：{days} 天 / {projects} 個專案',
			'toast.importFail': '匯入失敗：{err}',
			'toast.cleared': '已清除本機統計資料',
			'toast.copied': '報價單已複製到剪貼簿',
			'toast.copyFail': '複製失敗，請手動選取文字複製',
			'toast.noProject': '目前沒有開啟專案，無法產生報價單',
			'toast.badFormat': '檔案內容不是有效的資料格式',
			'toast.notOurs': '不是「健康使用 Blockbench」匯出的檔案',
			'toast.noData': '檔案裡沒有可匯入的資料',
		},
		en: {
			'panel.title': 'Health Use Blockbench',
			'action.name': 'Health Use Blockbench',
			'action.desc': 'View usage time, rating and labor cost',
			'plugin.description': 'Track modeling / texturing / animation time like a digital-wellbeing app, with a dashboard, trends, rating and labor cost calculator.',
			'plugin.about': 'A pure vibe-coding project, powered by DeepSeek.\n\nAll data stays on this machine; nothing is uploaded.\n\nFeedback / contact: Bilibili @圣起司 (https://space.bilibili.com/18095414)\nGitHub: https://github.com/liziqiang450-byte/blockbench-health-use\nGitee: https://gitee.com/hgx100/blockbench-health-use',
			'ratingDialog.title': 'Rating scale',
			'clear.title': 'Clear usage data',
			'clear.message': 'Clear all local statistics of "Health Use Blockbench"?\n\nThis cannot be undone. Export a JSON backup first if needed.',
			'clear.cancel': 'Cancel',
			'clear.confirm': 'Clear',
			'lang.auto': 'Auto (follow Blockbench)',
			'lang.zh-cn': '简体中文',
			'lang.zh-tw': '繁體中文',
			'lang.en': 'English',
			'cat.model': 'Modeling',
			'cat.texture': 'Texturing',
			'cat.animate': 'Animation',
			'cat.other': 'Other',
			'today.bigLabel': 'Today (excluding idle)',
			'today.categories': 'Today by category',
			'today.idle': 'Idle {time} (window focused but inactive; not counted in rating or cost)',
			'rating.viewStandard': 'View full rating scale',
			'rating.tag.sitting': 'Sitting warning',
			'rating.tag.nightOwl': 'Night owl',
			'rating.tag.tomorrowOff': 'Take tomorrow off',
			'help.today': 'Bar length = share of today total (excluding idle). The right side shows duration and percentage. Idle time (focused but inactive) is tracked separately and excluded from rating and cost.',
			'help.rating': 'Today total = modeling + texturing + animation + other (excluding idle). Rating is based on today total; tags come from continuous usage and late-night share. Click the rating badge or the ? in Settings for the full scale.',
			'help.trend': 'Last 7 days: one stacked bar per day, heights normalized to the busiest day, colors = category shares. Calendar: daily total plus a category bar; days before installation show "data unavailable". Daily curve: one point per day since installation, with 30-day / all ranges.',
			'help.project': 'Current project = selected .bbmodel (identified by save path; unsaved projects are session-only). Cost = sum(category time x effective rate), where effective rate = category rate, else project hourly rate, else global rate; then rounding and minimum fee apply.',
			'help.ranking': 'Top 10 projects by total time; cost uses each project own rates. Grey text after the name is the model identifier (model_identifier). Unsaved projects appear as "Untitled project" and are cleaned up after 30 days.',
			'help.settings': 'Hourly rate, category rates (empty = fall back to project rate then global), idle threshold, rating style, rounding, minimum fee, billable "other" time, and UI language. Changes are saved locally immediately.',
			'help.button': 'Show help',
			'trend.title': 'Trends',
			'trend.week': 'Last 7 days',
			'trend.calendar': 'Calendar',
			'trend.history': 'Daily curve',
			'trend.weekSum': 'Last 7 days total {time}',
			'trend.weekNote': 'Bar height normalized to the busiest day in the week; colors show category shares',
			'trend.range30': 'Last 30 days',
			'trend.rangeAll': 'All',
			'trend.installNote': 'Data before installation ({date}) is unavailable',
			'trend.empty': 'No history to show yet.',
			'calendar.prev': 'Previous month',
			'calendar.next': 'Next month',
			'calendar.month': '{m}/{y}',
			'calendar.missing': 'N/A',
			'calendar.missingDetail': ': data unavailable (before installation)',
			'calendar.futureDetail': ': not yet',
			'calendar.sep': ': ',
			'calendar.missingTip': ': data unavailable (before installation)',
			'calendar.futureTip': ': not yet',
			'week.today': 'Today',
			'dow.mon': 'Mon',
			'dow.tue': 'Tue',
			'dow.wed': 'Wed',
			'dow.thu': 'Thu',
			'dow.fri': 'Fri',
			'dow.sat': 'Sat',
			'dow.sun': 'Sun',
			'project.title': 'Current project: ',
			'project.untitled': 'Untitled project',
			'project.empty': 'No project open: this time is counted as "Other" and not attributed to any project.',
			'project.rateLabel': 'Project rate',
			'project.ratePlaceholder': 'Empty = global',
			'project.rateHint': 'Empty = global {rate}/h (category rates take priority)',
			'project.cost': 'Labor cost',
			'ranking.title': 'Project ranking',
			'ranking.count': '({count} total)',
			'ranking.empty': 'No accumulated data yet.',
			'settings.title': 'Settings',
			'settings.language': 'Language',
			'settings.hourly': 'Hourly rate',
			'settings.currency': 'Currency symbol',
			'settings.idle': 'Idle threshold',
			'settings.ratingStyle': 'Rating style',
			'settings.ratingFun': 'Fun',
			'settings.ratingSerious': 'Health advice',
			'settings.rounding': 'Rounding',
			'settings.roundMinute': 'Exact to the minute',
			'settings.roundHalfHour': 'Round up to 0.5 h',
			'settings.roundHour': 'Round up to 1 h',
			'settings.minFee': 'Minimum fee',
			'settings.otherBillable': 'Count "Other" time as billable',
			'settings.rateModel': 'Modeling rate (empty = global)',
			'settings.rateTexture': 'Texturing rate (empty = global)',
			'settings.rateAnimate': 'Animation rate (empty = global)',
			'settings.rateOther': '"Other" rate (empty = global)',
			'settings.ratePlaceholder': 'Empty',
			'buttons.export': 'Export JSON',
			'buttons.import': 'Import JSON (merge)',
			'buttons.copyQuote': 'Copy quote',
			'buttons.clear': 'Clear data',
			'footer.storage': 'Data stays on this machine (localStorage); nothing is uploaded',
			'footer.version': 'v{v} · build {stamp}',
			'footer.powered': 'Powered by DeepSeek',
			'footer.sep': ' · ',
			'footer.creditPrefix': 'Idea by ',
			'footer.creditName': 'Bilibili @圣起司',
			'footer.feedback': 'Feedback',
			'idle.60': 'After 1 minute',
			'idle.120': 'After 2 minutes (recommended)',
			'idle.300': 'After 5 minutes',
			'idle.600': 'After 10 minutes',
			'idle.0': 'Never (count whenever focused)',
			'rating.fun.0.title': 'Slacking star',
			'rating.fun.0.desc': 'Just getting started. Warm up first.',
			'rating.fun.1.title': 'Warming up',
			'rating.fun.1.desc': 'Good rhythm. Keep it going.',
			'rating.fun.2.title': 'Steady pace',
			'rating.fun.2.desc': 'Nice pace. Stand up every 90 minutes.',
			'rating.fun.3.title': 'Full-timer',
			'rating.fun.3.desc': 'That is a real workload. Remember to drink water.',
			'rating.fun.4.title': 'Grinder',
			'rating.fun.4.desc': 'High output, but do not overdo it. Your eyes need a break.',
			'rating.fun.5.title': 'Working overtime',
			'rating.fun.5.desc': 'This is a full-time job already. Watch your neck.',
			'rating.fun.6.title': 'All-nighter',
			'rating.fun.6.desc': 'Time to stop. Tomorrow is another day.',
			'rating.serious.0.title': 'Light use',
			'rating.serious.0.desc': 'Light use today. Keep a regular schedule.',
			'rating.serious.1.title': 'Normal range',
			'rating.serious.1.desc': 'Normal usage. Stand up for 1-2 minutes every hour.',
			'rating.serious.2.title': 'A bit long',
			'rating.serious.2.desc': 'Usage is getting long. Take a 5-minute break every 60 minutes.',
			'rating.serious.3.title': 'Long',
			'rating.serious.3.desc': 'Long time in one posture. Watch your neck, shoulders and eyes.',
			'rating.serious.4.title': 'Too long',
			'rating.serious.4.desc': 'Longer than most people use in a day. Take a break soon.',
			'rating.serious.5.title': 'Overload',
			'rating.serious.5.desc': 'Intense and prolonged use. Stop for today and get enough sleep.',
			'rating.serious.6.title': 'Severe overload',
			'rating.serious.6.desc': 'Stop immediately. Prolonged use significantly increases health risks.',
			'ratingDialog.intro': 'Rating is based on <b>today total</b> (modeling + texturing + animation + other, excluding idle):',
			'ratingDialog.colRange': 'Today total',
			'ratingDialog.colFun': 'Fun mode',
			'ratingDialog.colSerious': 'Health mode',
			'ratingDialog.tags': 'Extra tags: continuous use ≥ 90 min → <b>Sitting warning</b>; 23:00–05:00 share &gt; 30% → <b>Night owl</b>; ≥ 8h and late-night ≥ 1h → <b>Take tomorrow off</b>.',
			'ratingDialog.note': 'Rating style can be switched in Settings. Thresholds are fixed for now; they may become configurable later.',
			'quote.header': '[Blockbench work quote]',
			'quote.project': 'Project: {name}',
			'quote.line': '{label}: {time} ({rate}/h)',
			'quote.lineOther': 'Other: {time} ({rate}/h, {state})',
			'quote.billable': 'Billable time: {time}',
			'quote.hourly': 'Hourly rate: {rate}/h',
			'quote.rates': 'Rates: {rates}',
			'quote.total': 'Labor cost: {money}',
			'quote.time': 'Generated at: {time}',
			'quote.footer': '(Local stats from "Health Use Blockbench")',
			'quote.included': 'included',
			'quote.excluded': 'excluded',
			'toast.exported': 'Exported: {path}',
			'toast.exportFail': 'Export failed: {err}',
			'toast.importDone': 'Import complete (merged): {days} days / {projects} projects',
			'toast.importFail': 'Import failed: {err}',
			'toast.cleared': 'Local statistics cleared',
			'toast.copied': 'Quote copied to clipboard',
			'toast.copyFail': 'Copy failed; please copy manually',
			'toast.noProject': 'No project open; cannot generate a quote',
			'toast.badFormat': 'Invalid data format',
			'toast.notOurs': 'This file was not exported by "Health Use Blockbench"',
			'toast.noData': 'No importable data in this file',
		},
	};

	function currentLanguage() {
		let pref = 'auto';
		try { pref = (data && data.settings && data.settings.language) || 'auto'; } catch (err) { /* ignore */ }
		if (pref && pref !== 'auto' && LANGUAGES.indexOf(pref) >= 0) return pref;
		try {
			if (typeof settings !== 'undefined' && settings.language && settings.language.value) {
				const code = String(settings.language.value);
				if (code === 'zh') return 'zh-cn';
				if (code === 'zh_tw') return 'zh-tw';
				if (code === 'en') return 'en';
				return 'en';
			}
		} catch (err) { /* ignore */ }
		return 'zh-cn';
	}

	function t(key, vars) {
		const lang = currentLanguage();
		const dict = I18N[lang] || I18N['zh-cn'];
		let str = dict[key];
		if (str === undefined) str = I18N['zh-cn'][key];
		if (str === undefined) str = key;
		if (vars) {
			for (const k in vars) str = str.split('{' + k + '}').join(String(vars[k]));
		}
		return str;
	}
	function catLabel(id) { return t('cat.' + id); }

	const IDLE_OPTIONS = [
		{ v: 60, l: 'idle.60' },
		{ v: 120, l: 'idle.120' },
		{ v: 300, l: 'idle.300' },
		{ v: 600, l: 'idle.600' },
		{ v: 0, l: 'idle.0' },
	];
	const RATING_LIMITS = [1, 2, 4, 6, 8, 10, Infinity];

	// 评级标准弹窗的 HTML（按当前语言生成）
	function buildRatingTemplate() {
		const rows = RATING_LIMITS.map((upper, i) => {
			const lower = i === 0 ? 0 : RATING_LIMITS[i - 1];
			let range;
			if (upper === Infinity) range = '≥ ' + lower + 'h';
			else if (lower === 0) range = '< ' + upper + 'h';
			else range = lower + '–' + upper + 'h';
			return '<tr><td class="hubb-rt-range">' + range + '</td><td>' + t('rating.fun.' + i + '.title') + '</td><td>' + t('rating.serious.' + i + '.title') + '</td></tr>';
		}).join('');
		return '<div class="hubb-rating-dialog">'
			+ '<p>' + t('ratingDialog.intro') + '</p>'
			+ '<table class="hubb-rating-table">'
			+ '<thead><tr><th>' + t('ratingDialog.colRange') + '</th><th>' + t('ratingDialog.colFun') + '</th><th>' + t('ratingDialog.colSerious') + '</th></tr></thead>'
			+ '<tbody>' + rows + '</tbody></table>'
			+ '<p class="hubb-rating-tags">' + t('ratingDialog.tags') + '</p>'
			+ '<p class="hubb-rating-note">' + t('ratingDialog.note') + '</p>'
			+ '</div>';
	}

	// ------------------------------------------------------------
	// 数据层
	// ------------------------------------------------------------
	function emptySettings() {
		return {
			hourly_rate: 50,
			currency: '¥',
			idle_seconds: 120,
			rating_style: 'fun',
			rounding: 'minute',
			min_fee: 0,
			other_billable: true,
			// 分类费率：null = 使用项目/全局时薪
			rate_model: null,
			rate_texture: null,
			rate_animate: null,
			rate_other: null,
			language: 'auto',
		};
	}
	function emptyData() {
		return { version: 1, installed_at: dayKey(Date.now()), settings: emptySettings(), days: {}, projects: {} };
	}

	function normalizeData(input) {
		if (!input || typeof input !== 'object') return null;
		const d = input;
		d.version = 1;
		d.settings = Object.assign(emptySettings(), d.settings || {});
		d.days = (d.days && typeof d.days === 'object') ? d.days : {};
		d.projects = (d.projects && typeof d.projects === 'object') ? d.projects : {};
		// 安装日：缺失时用最早有数据的一天推断（老版本数据迁移），再不行就今天
		if (typeof d.installed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.installed_at)) {
			const keys = Object.keys(d.days).sort();
			d.installed_at = keys.length ? keys[0] : dayKey(Date.now());
		}
		for (const dayKeyStr in d.days) {
			const day = d.days[dayKeyStr];
			if (!day || typeof day !== 'object') { delete d.days[dayKeyStr]; continue; }
			CATS.forEach(c => { day[c] = Number(day[c]) || 0; });
			day.idle = Number(day.idle) || 0;
			day.night = Number(day.night) || 0;
			if (!day.projects || typeof day.projects !== 'object') day.projects = {};
			for (const pk in day.projects) {
				const dp = day.projects[pk];
				CATS.forEach(c => { dp[c] = Number(dp[c]) || 0; });
			}
		}
		for (const pk in d.projects) {
			const rec = d.projects[pk];
			if (!rec || typeof rec !== 'object') { delete d.projects[pk]; continue; }
			rec.totals = rec.totals || {};
			CATS.forEach(c => { rec.totals[c] = Number(rec.totals[c]) || 0; });
			if (rec.rate === undefined) rec.rate = null;
			if (typeof rec.identifier !== 'string') rec.identifier = '';
		}
		// 合法化设置项
		const s = d.settings;
		s.hourly_rate = Math.max(0, Number(s.hourly_rate) || 0);
		s.idle_seconds = Math.max(0, Number(s.idle_seconds) || 0);
		s.min_fee = Math.max(0, Number(s.min_fee) || 0);
		if (!s.currency) s.currency = '¥';
		if (['fun', 'serious'].indexOf(s.rating_style) < 0) s.rating_style = 'fun';
		if (['minute', 'half_hour_up', 'hour_up'].indexOf(s.rounding) < 0) s.rounding = 'minute';
		s.other_billable = s.other_billable !== false;
		['rate_model', 'rate_texture', 'rate_animate', 'rate_other'].forEach(k => {
			const v = s[k];
			if (v === null || v === undefined || v === '') { s[k] = null; return; }
			const n = Number(v);
			s[k] = (isFinite(n) && n >= 0) ? n : null;
		});
		if (['auto'].concat(LANGUAGES).indexOf(s.language) < 0) s.language = 'auto';
		return d;
	}

	function loadData() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return emptyData();
			const parsed = JSON.parse(raw);
			return normalizeData(parsed) || emptyData();
		} catch (err) {
			console.error('[健康使用 Blockbench] 读取数据失败', err);
			return emptyData();
		}
	}

	let data = loadData();
	let dirty = false;
	let lastSavedRaw = null;

	function markDirty() { dirty = true; }

	/** 把 src 的 days/projects 按"取较大值"合并进 target（多实例写回 / 导入共用） */
	function mergeDataMax(target, src) {
		if (!src || typeof src !== 'object') return;
		const days = src.days || {};
		for (const dk in days) {
			const inc = days[dk];
			if (!target.days[dk]) { target.days[dk] = inc; continue; }
			const cur = target.days[dk];
			CATS.forEach(c => { cur[c] = Math.max(cur[c] || 0, inc[c] || 0); });
			cur.idle = Math.max(cur.idle || 0, inc.idle || 0);
			cur.night = Math.max(cur.night || 0, inc.night || 0);
			const incProjects = inc.projects || {};
			for (const pk in incProjects) {
				if (!cur.projects[pk]) { cur.projects[pk] = incProjects[pk]; continue; }
				CATS.forEach(c => { cur.projects[pk][c] = Math.max(cur.projects[pk][c] || 0, incProjects[pk][c] || 0); });
			}
		}
		const projects = src.projects || {};
		for (const pk in projects) {
			const inc = projects[pk];
			if (!target.projects[pk]) { target.projects[pk] = inc; continue; }
			const cur = target.projects[pk];
			CATS.forEach(c => { cur.totals[c] = Math.max(cur.totals[c] || 0, inc.totals[c] || 0); });
			cur.name = cur.name || inc.name;
			cur.path = cur.path || inc.path;
			cur.format = cur.format || inc.format;
			cur.identifier = cur.identifier || inc.identifier;
			cur.first_seen = Math.min(cur.first_seen || Infinity, inc.first_seen || Infinity);
			if (!isFinite(cur.first_seen)) cur.first_seen = Date.now();
			cur.last_seen = Math.max(cur.last_seen || 0, inc.last_seen || 0);
			if ((cur.rate === null || cur.rate === undefined) && inc.rate !== undefined) cur.rate = inc.rate;
		}
		if (src.installed_at && (!target.installed_at || src.installed_at < target.installed_at)) {
			target.installed_at = src.installed_at;
		}
	}

	function saveData(force) {
		if (!dirty && !force) return;
		try {
			// 多实例：写入前先读一次，与其它实例的数据按"取较大值"合并，避免整块覆盖丢数据
			const currentRaw = localStorage.getItem(STORAGE_KEY);
			if (currentRaw && currentRaw !== lastSavedRaw) {
				try {
					const other = normalizeData(JSON.parse(currentRaw));
					if (other) mergeDataMax(data, other);
				} catch (e) { /* 其它实例数据损坏则忽略 */ }
			}
			const raw = JSON.stringify(data);
			localStorage.setItem(STORAGE_KEY, raw);
			lastSavedRaw = raw;
			dirty = false;
		} catch (err) {
			console.error('[健康使用 Blockbench] 保存数据失败', err);
		}
	}

	function ensureDay(dk) {
		if (!data.days[dk]) {
			data.days[dk] = { model: 0, texture: 0, animate: 0, other: 0, idle: 0, night: 0, projects: {} };
		}
		return data.days[dk];
	}
	function ensureDayProject(day, key) {
		if (!day.projects[key]) day.projects[key] = { model: 0, texture: 0, animate: 0, other: 0 };
		return day.projects[key];
	}
	function ensureProject(key) {
		if (!data.projects[key]) {
			data.projects[key] = {
				name: t('project.untitled'), path: '', format: '', identifier: '',
				first_seen: Date.now(), last_seen: Date.now(),
				totals: { model: 0, texture: 0, animate: 0, other: 0 },
				rate: null,
			};
		}
		return data.projects[key];
	}

	// ------------------------------------------------------------
	// 时间与归因
	// ------------------------------------------------------------
	function pad2(n) { return n < 10 ? '0' + n : '' + n; }
	function dayKey(ts) {
		const d = new Date(ts);
		return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
	}
	function nextMidnight(ts) {
		const d = new Date(ts);
		return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
	}
	function isNight(ts) {
		const h = new Date(ts).getHours();
		return h >= 23 || h < 5;
	}

	function addToDay(dk, ms, key, cat, ts) {
		const day = ensureDay(dk);
		const sec = ms / 1000;
		if (cat && day[cat] !== undefined) day[cat] += sec;
		if (isNight(ts)) day.night += sec;
		if (key) {
			const dp = ensureDayProject(day, key);
			if (cat && dp[cat] !== undefined) dp[cat] += sec;
			const rec = ensureProject(key);
			if (cat && rec.totals[cat] !== undefined) rec.totals[cat] += sec;
		}
	}

	/** 把一段时间(ms)按本地日期拆分后记入账本（跨天自动拆） */
	function addMs(ms, key, cat, ts) {
		if (!(ms > 0)) return;
		markDirty();
		const start = ts - ms;
		const end = ts;
		const d1 = dayKey(start);
		const d2 = dayKey(end);
		if (d1 === d2) {
			addToDay(d1, ms, key, cat, start);
		} else {
			const mid = nextMidnight(start);
			const p1 = Math.max(0, mid - start);
			const p2 = Math.max(0, end - mid);
			if (p1) addToDay(d1, p1, key, cat, start);
			if (p2) addToDay(d2, p2, key, cat, mid);
		}
	}

	function addIdle(ms, ts) {
		if (!(ms > 0)) return;
		markDirty();
		const start = ts - ms;
		const d1 = dayKey(start);
		const d2 = dayKey(ts);
		if (d1 === d2) {
			ensureDay(d1).idle += ms / 1000;
		} else {
			const mid = nextMidnight(start);
			ensureDay(d1).idle += Math.max(0, mid - start) / 1000;
			ensureDay(d2).idle += Math.max(0, ts - mid) / 1000;
		}
	}

	function idleSeconds() {
		const v = Number(data.settings.idle_seconds);
		return isFinite(v) && v >= 0 ? v : 120;
	}

	function currentModeId() {
		try {
			if (typeof Mode !== 'undefined' && Mode && Mode.selected && Mode.selected.id) return Mode.selected.id;
			if (typeof Project !== 'undefined' && Project && Project.mode) return Project.mode;
		} catch (err) { /* ignore */ }
		return '';
	}
	function currentCategory() {
		const id = currentModeId();
		return MODE_CATEGORY[id] || 'other';
	}

	const projectKeyCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

	function projectInfo() {
		if (typeof Project === 'undefined' || !Project) return null;
		try {
			const p = Project;
			const savePath = p.save_path || '';
			const namePath = savePath || p.export_path || '';
			// 项目身份：优先用保存路径（跨会话稳定），未保存项目用本次会话的 uuid
			const desired = savePath
				? 'path:' + String(savePath).replace(/\\/g, '/').toLowerCase()
				: 'tmp:' + (p.uuid || 'unknown');
			let key = projectKeyCache ? projectKeyCache.get(p) : null;
			if (!key) {
				key = desired;
			} else if (key !== desired) {
				// 同一项目对象从未保存变为已保存（或另存为）：把历史合并到新 key
				migrateKey(key, desired);
				key = desired;
			}
			if (projectKeyCache) projectKeyCache.set(p, key);
			let name = p.name || '';
			if (!name && namePath) {
				const parts = String(namePath).split(/[\\/]/);
				name = (parts[parts.length - 1] || '').replace(/\.bbmodel$/i, '');
			}
			let format = '';
			try {
				if (typeof Format !== 'undefined' && Format && Format.id) format = Format.id;
			} catch (e) { /* ignore */ }
			return { key, name: name || t('project.untitled'), path: savePath || namePath, format, identifier: p.model_identifier || '' };
		} catch (err) {
			return null;
		}
	}

	function touchProjectMeta(info, ts) {
		if (!info || !data.projects[info.key]) return;
		const rec = data.projects[info.key];
		if (info.name) rec.name = info.name;
		if (info.path) rec.path = info.path;
		if (info.format) rec.format = info.format;
		rec.identifier = info.identifier || '';
		rec.last_seen = ts || Date.now();
		markDirty();
	}

	/** 项目另存/保存为 bbmodel 后 key 从 tmp: 迁移到 path:，合并历史 */
	function migrateKey(oldKey, newKey) {
		if (!oldKey || !newKey || oldKey === newKey) return;
		const from = data.projects[oldKey];
		if (!from) return;
		const to = ensureProject(newKey);
		CATS.forEach(c => { to.totals[c] += from.totals[c] || 0; });
		to.first_seen = Math.min(to.first_seen || Infinity, from.first_seen || Infinity);
		if (!isFinite(to.first_seen)) to.first_seen = Date.now();
		to.last_seen = Math.max(to.last_seen || 0, from.last_seen || 0);
		for (const dk in data.days) {
			const proj = data.days[dk].projects;
			if (proj && proj[oldKey]) {
				const dp = ensureDayProject(data.days[dk], newKey);
				CATS.forEach(c => { dp[c] += proj[oldKey][c] || 0; });
				delete proj[oldKey];
			}
		}
		delete data.projects[oldKey];
		markDirty();
	}

	// 清理长期未出现的未保存项目记录（没有对应文件，留着只会污染排行）
	// 注意：同时清理持久化副本，否则下次保存时的"多实例合并"会把它们又合并回来
	function pruneTmpProjects(maxAgeDays) {
		const cutoff = Date.now() - (maxAgeDays || 30) * 86400000;
		let removed = 0;
		const pruneIn = (target) => {
			let n = 0;
			if (!target || !target.projects) return 0;
			for (const key in target.projects) {
				if (key.indexOf('tmp:') === 0 && (Number(target.projects[key].last_seen) || 0) < cutoff) {
					delete target.projects[key];
					n++;
				}
			}
			return n;
		};
		removed = pruneIn(data);
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const stored = normalizeData(JSON.parse(raw));
				if (stored && pruneIn(stored)) {
					const newRaw = JSON.stringify(stored);
					localStorage.setItem(STORAGE_KEY, newRaw);
					lastSavedRaw = newRaw;
				}
			}
		} catch (err) { /* ignore */ }
		if (removed) markDirty();
		return removed;
	}
	const state = {
		lastInput: Date.now(),
		lastTick: Date.now(),
		continuousStart: 0,
		currentKey: null,
		tickTimer: null,
		saveTimer: null,
		handlers: [],
	};

	function isFocused() {
		try {
			if (typeof document !== 'undefined' && typeof document.hasFocus === 'function') return document.hasFocus();
		} catch (err) { /* ignore */ }
		return true;
	}

	function onInput() {
		state.lastInput = Date.now();
		if (!state.continuousStart) state.continuousStart = state.lastInput;
	}
	function onFocus() {
		state.lastTick = Date.now();
		state.lastInput = Date.now();
		if (!state.continuousStart) state.continuousStart = Date.now();
	}
	function onBlur() {
		state.continuousStart = 0;
		state.lastTick = Date.now();
		saveData();
	}
	function onVisibility() {
		try {
			if (document.visibilityState === 'hidden') onBlur();
			else onFocus();
		} catch (err) { /* ignore */ }
	}

	function tick() {
		const now = Date.now();
		let delta = now - state.lastTick;
		state.lastTick = now;
		if (!(delta > 0)) return;
		// 睡眠/主线程长时间卡顿：不补记，避免虚增
		if (delta > 60000) {
			state.continuousStart = 0;
			return;
		}

		const focused = isFocused();
		if (!focused) {
			state.continuousStart = 0;
			return;
		}

		const idleMs = idleSeconds() * 1000;
		const active = idleMs <= 0 || (now - state.lastInput < idleMs);
		if (!active) {
			addIdle(delta, now);
			state.continuousStart = 0;
			return;
		}

		if (!state.continuousStart) state.continuousStart = now;

		const info = projectInfo();
		const key = info ? info.key : null;
		if (key !== state.currentKey) {
			if (state.currentKey && key &&
				state.currentKey.indexOf('tmp:') === 0 && key.indexOf('path:') === 0) {
				migrateKey(state.currentKey, key);
			}
			state.currentKey = key;
		}

		addMs(delta, key, currentCategory(), now);
		if (key && info) touchProjectMeta(info, now);
	}

	function currentContinuousMin() {
		if (!state.continuousStart) return 0;
		return Math.max(0, (Date.now() - state.continuousStart) / 60000);
	}

	// ------------------------------------------------------------
	// 评级与费用
	// ------------------------------------------------------------
	function getRating(totalSec, nightSec, continuousMin, style) {
		const hours = totalSec / 3600;
		let idx = RATING_LIMITS.length - 1;
		for (let i = 0; i < RATING_LIMITS.length; i++) {
			if (hours < RATING_LIMITS[i]) { idx = i; break; }
		}
		const prefix = (style === 'serious') ? 'rating.serious.' : 'rating.fun.';
		const title = t(prefix + idx + '.title');
		const desc = t(prefix + idx + '.desc');
		const tags = [];
		if (continuousMin >= 90) tags.push(t('rating.tag.sitting'));
		if (totalSec > 0 && nightSec > 0 && nightSec / totalSec > 0.3) tags.push(t('rating.tag.nightOwl'));
		if (hours >= 8 && nightSec >= 3600) tags.push(t('rating.tag.tomorrowOff'));
		return { title, desc, tags, hours };
	}

	function billableSeconds(rec) {
		if (!rec) return 0;
		const t = rec.totals || {};
		let sec = (Number(t.model) || 0) + (Number(t.texture) || 0) + (Number(t.animate) || 0);
		if (data.settings.other_billable) sec += (Number(t.other) || 0);
		return sec;
	}

	const CAT_RATE_KEY = { model: 'rate_model', texture: 'rate_texture', animate: 'rate_animate', other: 'rate_other' };

	function projectRate(rec) {
		if (rec && rec.rate !== null && rec.rate !== undefined && rec.rate !== '') {
			const r = Number(rec.rate);
			if (isFinite(r) && r >= 0) return r;
		}
		return Math.max(0, Number(data.settings.hourly_rate) || 0);
	}

	/** 某个分类的费率：分类费率优先，否则用项目/全局时薪 */
	function rateForCategory(cat, rec) {
		const key = CAT_RATE_KEY[cat];
		const v = key ? data.settings[key] : null;
		if (v !== null && v !== undefined && v !== '' && isFinite(Number(v)) && Number(v) >= 0) return Number(v);
		return projectRate(rec);
	}

	/** 参与计费的分类（"其它"是否计费取决于设置） */
	function billableCategories() {
		const list = ['model', 'texture', 'animate'];
		if (data.settings.other_billable) list.push('other');
		return list;
	}

	/** 分类费率 + 取整缩放 + 最低收费后的人工费 */
	function calcProjectCost(rec) {
		if (!rec || !rec.totals) return 0;
		const t = rec.totals;
		let totalSec = 0;
		let exact = 0;
		billableCategories().forEach(cat => {
			const sec = Math.max(0, Number(t[cat]) || 0);
			if (sec <= 0) return;
			totalSec += sec;
			exact += (sec / 3600) * rateForCategory(cat, rec);
		});
		if (totalSec <= 0) return 0;
		let amount = exact;
		const rounding = data.settings.rounding;
		if (rounding === 'half_hour_up' || rounding === 'hour_up') {
			const unit = rounding === 'half_hour_up' ? 1800 : 3600;
			const roundedSec = Math.ceil(totalSec / unit) * unit;
			// 按总工时的取整比例缩放，保留分类费率的构成
			amount = exact * (roundedSec / totalSec);
		}
		const minFee = Math.max(0, Number(data.settings.min_fee) || 0);
		if (minFee > 0) amount = Math.max(amount, minFee);
		return Math.round(amount * 100) / 100;
	}

	/** 报价单里描述本项目实际费率 */
	function rateDescription(rec) {
		const parts = [];
		billableCategories().forEach(cat => {
			parts.push(catLabel(cat) + ' ' + fmtMoney(rateForCategory(cat, rec)) + '/h');
		});
		const globalRate = projectRate(rec);
		const uniform = billableCategories().every(cat => rateForCategory(cat, rec) === globalRate);
		return { text: parts.join(' · '), uniform, globalRate };
	}

	function calcCost(seconds, rate) {
		if (!(seconds > 0) || !(rate > 0)) return 0;
		let hours;
		const rounding = data.settings.rounding;
		if (rounding === 'half_hour_up') hours = Math.ceil(seconds / 1800) / 2;
		else if (rounding === 'hour_up') hours = Math.ceil(seconds / 3600);
		else hours = seconds / 3600;
		let amount = hours * rate;
		const minFee = Math.max(0, Number(data.settings.min_fee) || 0);
		if (minFee > 0) amount = Math.max(amount, minFee);
		return Math.round(amount * 100) / 100;
	}

	// ------------------------------------------------------------
	// 展示辅助
	// ------------------------------------------------------------
	function fmt(sec) {
		sec = Math.max(0, Math.round(Number(sec) || 0));
		if (sec < 60) return sec + 's';
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		if (h <= 0) return m + 'm';
		return h + 'h ' + pad2(m) + 'm';
	}
	function fmtMoney(n) {
		const v = Math.round((Number(n) || 0) * 100) / 100;
		return (data.settings.currency || '¥') + v.toFixed(2);
	}
	function dayLabel(dk, isToday) {
		if (isToday) return t('week.today');
		return dk.slice(5); // MM-DD
	}

	// ------------------------------------------------------------
	// 日历 / 历史曲线
	// ------------------------------------------------------------
	function dowLabels() {
		return [t('dow.mon'), t('dow.tue'), t('dow.wed'), t('dow.thu'), t('dow.fri'), t('dow.sat'), t('dow.sun')];
	}
	function parseDayKey(dk) {
		const p = String(dk).split('-').map(Number);
		return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
	}
	function keyFromDate(d) {
		return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
	}
	function addDaysToKey(dk, n) {
		const d = parseDayKey(dk);
		d.setDate(d.getDate() + n);
		return keyFromDate(d);
	}
	function dayTotal(dk) {
		const dd = data.days[dk];
		if (!dd) return 0;
		return CATEGORY_ORDER.reduce((s, c) => s + (Number(dd[c]) || 0), 0);
	}
	function dayCatList(dk) {
		const dd = data.days[dk] || {};
		const list = CATEGORY_ORDER.map(id => ({
			id, label: catLabel(id), color: CAT_COLOR[id],
			seconds: Math.round(Number(dd[id]) || 0),
		}));
		const total = list.reduce((s, c) => s + c.seconds, 0);
		list.forEach(c => { c.pct = total > 0 ? Math.round((c.seconds / total) * 100) : 0; });
		return { list, total };
	}

	function buildCalendar(year, month, selectedDate) {
		const installed = data.installed_at || dayKey(Date.now());
		const todayK = dayKey(Date.now());
		const first = new Date(year, month, 1);
		const startOffset = (first.getDay() + 6) % 7; // 周一为 0
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const cells = [];
		const makeCell = (date, inMonth) => {
			const dk = keyFromDate(date);
			const missing = dk < installed;
			const future = dk > todayK;
			const { list, total } = dayCatList(dk);
			const segs = list.filter(c => c.seconds > 0).map(c => ({ id: c.id, pct: c.pct, color: c.color }));
			const pctText = list.map(c => c.label + ' ' + c.pct + '%').join(' · ');
			let tooltip;
			if (missing) tooltip = dk + t('calendar.missingTip');
			else if (future) tooltip = dk + t('calendar.futureTip');
			else tooltip = dk + t('calendar.sep') + fmt(total) + (total > 0 ? ' ｜ ' + pctText : '');
			return {
				date: dk, day: date.getDate(), inMonth, missing, future,
				isToday: dk === todayK,
				total: (missing || future) ? 0 : total,
				segs, cats: list, tooltip,
			};
		};
		for (let i = 0; i < startOffset; i++) {
			cells.push(makeCell(new Date(year, month, 1 - startOffset + i), false));
		}
		for (let d = 1; d <= daysInMonth; d++) cells.push(makeCell(new Date(year, month, d), true));
		while (cells.length % 7 !== 0) {
			const last = parseDayKey(cells[cells.length - 1].date);
			last.setDate(last.getDate() + 1);
			cells.push(makeCell(last, false));
		}
		let selected = null;
		if (selectedDate) {
			const dk = selectedDate;
			const missing = dk < installed;
			const future = dk > todayK;
			const { list, total } = dayCatList(dk);
			selected = { date: dk, missing, future, total: (missing || future) ? 0 : total, cats: list };
		}
		const nowDate = new Date();
		return {
			year, month,
			label: t('calendar.month', { y: year, m: month + 1 }),
			dow: dowLabels(),
			cells,
			selected,
			isCurrentMonth: year === nowDate.getFullYear() && month === nowDate.getMonth(),
		};
	}

	function niceMax(seconds) {
		if (!(seconds > 0)) return 1800;
		return Math.max(1800, Math.ceil(seconds / 1800) * 1800);
	}

	function buildHistory(range) {
		const installed = data.installed_at || dayKey(Date.now());
		const todayK = dayKey(Date.now());
		let start = installed;
		if (range === '30') {
			const s = addDaysToKey(todayK, -29);
			start = s > installed ? s : installed;
		}
		const days = [];
		let dk = start;
		let guard = 0;
		while (dk <= todayK && guard < 4000) {
			days.push({ date: dk, total: dayTotal(dk), label: dk.slice(5) });
			dk = addDaysToKey(dk, 1);
			guard++;
		}
		const n = days.length;
		const max = niceMax(Math.max.apply(null, days.map(d => d.total).concat([1])));
		const W = 1000, H = 180, TOP = 10, BOTTOM = 150;
		const xOf = i => n <= 1 ? W / 2 : (i / (n - 1)) * W;
		const yOf = v => BOTTOM - (v / max) * (BOTTOM - TOP);
		const pts = days.map((d, i) => ({ x: xOf(i), y: yOf(d.total) }));
		let path = '';
		if (n > 0) {
			path = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
			for (let i = 1; i < n; i++) path += ' L ' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1);
		}
		const area = n > 0
			? path + ' L ' + pts[n - 1].x.toFixed(1) + ' ' + BOTTOM + ' L ' + pts[0].x.toFixed(1) + ' ' + BOTTOM + ' Z'
			: '';
		const xLabels = [];
		if (n > 0) {
			const idxs = n <= 2 ? [0, n - 1] : [0, Math.floor((n - 1) / 2), n - 1];
			const seen = {};
			idxs.forEach(i => {
				if (seen[i]) return;
				seen[i] = 1;
				xLabels.push({ x: pts[i].x, text: days[i].label, anchor: i === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle') });
			});
		}
		const yLabels = [
			{ y: TOP, text: fmt(max) },
			{ y: (TOP + BOTTOM) / 2, text: fmt(max / 2) },
			{ y: BOTTOM, text: '0' },
		];
		const points = n <= 120
			? days.map((d, i) => ({ x: pts[i].x, y: pts[i].y, label: d.date.slice(5), text: fmt(d.total) }))
			: [];
		return {
			range, days: n, start, end: todayK, max, path, area, xLabels, yLabels, points,
			installedAt: installed,
			note: t('trend.installNote', { date: installed }),
		};
	}

	function buildSnapshot(opts) {
		const now = Date.now();
		const todayK = dayKey(now);
		const today = data.days[todayK] || {};

		const cats = CATEGORY_ORDER.map(id => ({
			id,
			label: catLabel(id),
			color: CAT_COLOR[id],
			seconds: Math.round(Number(today[id]) || 0),
		}));
		const total = cats.reduce((s, c) => s + c.seconds, 0);
		const idle = Math.round(Number(today.idle) || 0);
		cats.forEach(c => { c.pct = total > 0 ? Math.round((c.seconds / total) * 100) : 0; });

		let acc = 0;
		const stops = [];
		CATEGORY_ORDER.forEach((id, i) => {
			const sec = cats[i].seconds;
			if (sec > 0 && total > 0) {
				const start = acc;
				acc += (sec / total) * 100;
				stops.push(CAT_COLOR[id] + ' ' + start.toFixed(2) + '% ' + acc.toFixed(2) + '%');
			}
		});
		const donut = total > 0
			? 'conic-gradient(' + stops.join(', ') + ')'
			: 'conic-gradient(var(--color-border, #3a3a3a) 0% 100%)';

		const rating = getRating(total, Number(today.night) || 0, currentContinuousMin(), data.settings.rating_style);

		// 最近 7 天
		const week = [];
		let weekTotal = 0;
		for (let i = 6; i >= 0; i--) {
			const ts = now - i * 86400000;
			const dk = dayKey(ts);
			const dd = data.days[dk] || {};
			const dayTotal = CATEGORY_ORDER.reduce((s, c) => s + (Number(dd[c]) || 0), 0);
			weekTotal += dayTotal;
			week.push({ date: dk, label: dayLabel(dk, i === 0), isToday: i === 0, total: dayTotal, day: dd });
		}
		const maxDay = Math.max(1, ...week.map(w => w.total));
		week.forEach(w => {
			w.segments = CATEGORY_ORDER.map(id => {
				const sec = Number(w.day[id]) || 0;
				return {
					id,
					color: CAT_COLOR[id],
					h: (sec / maxDay) * 100,
					title: catLabel(id) + ' ' + fmt(sec),
				};
			}).filter(s => s.h > 0.2);
		});

		// 当前项目
		const info = projectInfo();
		let current = null;
		if (info) {
			const rec = data.projects[info.key];
			const t = (rec && rec.totals) || { model: 0, texture: 0, animate: 0, other: 0 };
			const projCats = CATEGORY_ORDER.map(id => ({
				id,
				label: catLabel(id),
				color: CAT_COLOR[id],
				seconds: Math.round(Number(t[id]) || 0),
			}));
			const projTotal = projCats.reduce((s, c) => s + c.seconds, 0);
			projCats.forEach(c => { c.pct = projTotal > 0 ? Math.round((c.seconds / projTotal) * 100) : 0; });
			const rateInfo = rateDescription(rec);
			current = {
				name: (rec && rec.name) || info.name,
				path: (rec && rec.path) || info.path,
				identifier: (rec && rec.identifier) || info.identifier || '',
				total: projTotal,
				cats: projCats,
				rateOverride: (rec && rec.rate !== null && rec.rate !== undefined) ? rec.rate : '',
				globalRate: Math.max(0, Number(data.settings.hourly_rate) || 0),
				cost: calcProjectCost(rec),
				rateUniform: rateInfo.uniform,
				rateText: rateInfo.text,
			};
		}

		// 项目排行
		const ranking = Object.keys(data.projects).map(key => {
			const rec = data.projects[key];
			const t = rec.totals || {};
			const pTotal = CATEGORY_ORDER.reduce((s, c) => s + (Number(t[c]) || 0), 0);
			return {
				key,
				name: rec.name || t('project.untitled'),
				path: rec.path || '',
				identifier: rec.identifier || '',
				total: pTotal,
				cost: calcProjectCost(rec),
			};
		}).filter(p => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);

		const projectCount = Object.keys(data.projects).length;

		// 日历 / 历史曲线（42 个 cell + 一条 SVG path，每秒重建成本可接受）
		const nowDate = new Date(now);
		const calYear = (opts && typeof opts.year === 'number') ? opts.year : nowDate.getFullYear();
		const calMonth = (opts && typeof opts.month === 'number') ? opts.month : nowDate.getMonth();
		const historyRange = (opts && opts.range === '30') ? '30' : 'all';
		const selectedDate = (opts && opts.selected) || todayK;
		const calendar = buildCalendar(calYear, calMonth, selectedDate);
		const history = buildHistory(historyRange);

		return {
			today: {
				total,
				idle,
				cats,
				donut,
				donutLabel: fmt(total),
				rating,
			},
			week,
			weekTotal,
			current,
			ranking,
			projectCount,
			calendar,
			history,
			settings: data.settings,
		};
	}

	// ------------------------------------------------------------
	// 导入 / 导出 / 报价单
	// ------------------------------------------------------------
	function exportData() {
		saveData(true);
		const payload = {
			format: 'health-use-blockbench',
			version: 1,
			exported_at: new Date().toISOString(),
			settings: data.settings,
			days: data.days,
			projects: data.projects,
		};
		const content = JSON.stringify(payload, null, 2);
		try {
			Blockbench.exportFile({
				type: 'JSON',
				extensions: ['json'],
				name: 'blockbench-wellbeing-' + dayKey(Date.now()),
				content,
			}, path => {
				Blockbench.showQuickMessage(t('toast.exported', { path: path || 'JSON' }), 2500);
			});
		} catch (err) {
			Blockbench.showQuickMessage(t('toast.exportFail', { err }), 4000);
		}
	}

	function mergeImported(incoming) {
		if (!incoming || typeof incoming !== 'object') throw new Error(t('toast.badFormat'));
		if (incoming.format && incoming.format !== 'health-use-blockbench') {
			throw new Error(t('toast.notOurs'));
		}
		if (!incoming.days && !incoming.projects) throw new Error(t('toast.noData'));
		const src = normalizeData(incoming);
		if (!src) throw new Error(t('toast.badFormat'));
		mergeDataMax(data, src);
		markDirty();
		saveData(true);
		return {
			mergedDays: Object.keys(src.days || {}).length,
			mergedProjects: Object.keys(src.projects || {}).length,
		};
	}

	function importData(cb) {
		try {
			Blockbench.importFile({
				type: 'JSON',
				extensions: ['json'],
				readtype: 'text',
			}, files => {
				if (!files || !files.length) return;
				try {
					const parsed = JSON.parse(files[0].content);
					const result = mergeImported(parsed);
					Blockbench.showQuickMessage(t('toast.importDone', { days: result.mergedDays, projects: result.mergedProjects }), 3500);
					if (cb) cb();
				} catch (err) {
					Blockbench.showQuickMessage(t('toast.importFail', { err: (err && err.message ? err.message : err) }), 4000);
				}
			});
		} catch (err) {
			Blockbench.showQuickMessage(t('toast.importFail', { err }), 4000);
		}
	}

	function projectQuote() {
		const info = projectInfo();
		const rec = info ? data.projects[info.key] : null;
		if (!info || !rec) return null;
		const tot = rec.totals || {};
		const sec = billableSeconds(rec);
		const cost = calcProjectCost(rec);
		const rates = rateDescription(rec);
		const lines = [];
		lines.push(t('quote.header'));
		lines.push(t('quote.project', { name: rec.name || info.name }));
		['model', 'texture', 'animate'].forEach(cat => {
			lines.push(t('quote.line', { label: catLabel(cat), time: fmt(tot[cat] || 0), rate: fmtMoney(rateForCategory(cat, rec)) }));
		});
		lines.push(t('quote.lineOther', {
			time: fmt(tot.other || 0),
			rate: fmtMoney(rateForCategory('other', rec)),
			state: data.settings.other_billable ? t('quote.included') : t('quote.excluded'),
		}));
		lines.push(t('quote.billable', { time: fmt(sec) }));
		if (rates.uniform) lines.push(t('quote.hourly', { rate: fmtMoney(rates.globalRate) }));
		else lines.push(t('quote.rates', { rates: rates.text }));
		lines.push(t('quote.total', { money: fmtMoney(cost) }));
		lines.push(t('quote.time', { time: new Date().toLocaleString() }));
		lines.push(t('quote.footer'));
		return { text: lines.join('\n'), cost };
	}

	function copyText(text) {
		const fallback = (resolve, reject) => {
			try {
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
				resolve();
			} catch (err) {
				reject(err);
			}
		};
		return new Promise((resolve, reject) => {
			try {
				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(text)
						.then(resolve)
						.catch(() => fallback(resolve, reject));
					return;
				}
			} catch (err) { /* fall through */ }
			fallback(resolve, reject);
		});
	}

	function resetData() {
		Blockbench.showMessageBox({
			icon: 'warning',
			title: t('clear.title'),
			message: t('clear.message'),
			buttons: [t('clear.cancel'), t('clear.confirm')],
			cancelIndex: 0,
		}, button => {
			if (button !== 1) return;
			data = emptyData();
			state.currentKey = null;
			try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
			lastSavedRaw = null;
			dirty = true;
			saveData(true);
			Blockbench.showQuickMessage(t('toast.cleared'));
		});
	}

	// ------------------------------------------------------------
	// 样式
	// ------------------------------------------------------------
	const CSS = `
		.hubb-panel { display: flex; flex-direction: column; gap: 12px; padding: 16px 18px 18px; font-size: 13px; color: var(--color-text, #e6e6e6); max-height: 74vh; overflow-y: auto; }
		.hubb-head { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
		.hubb-today { font-size: 38px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; }
		.hubb-today-label { font-size: 11px; color: var(--color-subtle_text, #9aa0a6); margin-top: 2px; }
		.hubb-badge-wrap { flex: 1; min-width: 200px; }
		.hubb-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: var(--color-accent, #4a9eff); color: #fff; font-weight: 700; font-size: 14px; }
		.hubb-tags { display: inline-flex; gap: 6px; margin-left: 8px; flex-wrap: wrap; vertical-align: middle; }
		.hubb-tag { padding: 2px 8px; border-radius: 10px; background: rgba(246,153,63,.18); color: #f6993f; font-size: 11px; }
		.hubb-note { margin-top: 6px; color: var(--color-subtle_text, #9aa0a6); font-size: 11px; }
		.hubb-donut { width: 92px; height: 92px; border-radius: 50%; flex: none; }
		.hubb-donut-hole { width: 66px; height: 66px; border-radius: 50%; background: var(--color-elevated, #2b2b2b); margin: 13px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-card { border: 1px solid var(--color-border, #3a3a3a); border-radius: 8px; padding: 12px 14px; background: var(--color-elevated, rgba(0,0,0,.15)); }
		.hubb-card-title { font-weight: 700; margin-bottom: 10px; font-size: 13px; }
		.hubb-dim { font-weight: 400; color: var(--color-subtle_text, #9aa0a6); font-size: 11px; }
		.hubb-cat { display: flex; align-items: center; gap: 10px; margin: 7px 0; }
		.hubb-cat-name { width: 64px; flex: none; color: var(--color-subtle_text, #c9cdd2); }
		.hubb-track { flex: 1; height: 8px; border-radius: 4px; background: rgba(128,128,128,.18); overflow: hidden; }
		.hubb-track-fill { height: 100%; border-radius: 4px; transition: width .25s ease; }
		.hubb-cat-time { width: 64px; text-align: right; flex: none; font-variant-numeric: tabular-nums; }
		.hubb-cat-pct { width: 38px; text-align: right; flex: none; color: var(--color-subtle_text, #9aa0a6); font-size: 11px; }
		.hubb-idle { margin-top: 8px; font-size: 11px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-week { display: flex; align-items: flex-end; gap: 8px; height: 108px; margin-top: 4px; }
		.hubb-wday { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
		.hubb-wbar { width: 100%; max-width: 46px; flex: 1; display: flex; flex-direction: column-reverse; border-radius: 4px 4px 2px 2px; background: rgba(128,128,128,.12); overflow: hidden; }
		.hubb-wseg { width: 100%; }
		.hubb-wlabel { font-size: 10px; color: var(--color-subtle_text, #9aa0a6); margin-top: 6px; white-space: nowrap; }
		.hubb-wlabel-today { color: var(--color-accent, #4a9eff); font-weight: 700; }
		.hubb-week-sum { margin-top: 8px; font-size: 11px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-proj-line { display: flex; align-items: baseline; gap: 14px; margin-bottom: 8px; }
		.hubb-proj-total { font-size: 26px; font-weight: 800; }
		.hubb-proj-cost { color: #38c172; font-weight: 700; }
		.hubb-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
		.hubb-hint { font-size: 11px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-rank { display: flex; align-items: center; gap: 10px; padding: 4px 0; border-bottom: 1px dashed rgba(128,128,128,.15); }
		.hubb-rank:last-child { border-bottom: none; }
		.hubb-rank-no { width: 18px; color: var(--color-subtle_text, #9aa0a6); font-size: 11px; }
		.hubb-rank-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.hubb-rank-id { color: var(--color-subtle_text, #9aa0a6); font-size: 10px; }
		.hubb-rank-time { width: 70px; text-align: right; font-variant-numeric: tabular-nums; }
		.hubb-rank-cost { width: 84px; text-align: right; color: #38c172; font-variant-numeric: tabular-nums; }
		.hubb-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 14px; }
		.hubb-field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-field label { font-size: 11px; }
		.hubb-check { grid-column: span 3; flex-direction: row; align-items: center; }
		.hubb-input { background: var(--color-dark, rgba(0,0,0,.2)); color: var(--color-text, #e6e6e6); border: 1px solid var(--color-border, #3a3a3a); border-radius: 4px; padding: 4px 6px; font-size: 12px; }
		.hubb-actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
		.hubb-btn { background: var(--color-accent, #4a9eff); color: #fff; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px; }
		.hubb-btn:hover { filter: brightness(1.1); }
		.hubb-btn-danger { background: #e3342f; }
		.hubb-empty { color: var(--color-subtle_text, #9aa0a6); font-size: 11px; }
		.hubb-foot { margin-top: 10px; font-size: 10px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-link { color: var(--color-accent, #4a9eff); text-decoration: none; }
		.hubb-link:hover { text-decoration: underline; }
		.hubb-week, .hubb-card { user-select: none; }
		.hubb-flex { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
		.hubb-cal-nav, .hubb-range { display: inline-flex; align-items: center; gap: 6px; }
		.hubb-nav { background: transparent; color: inherit; border: 1px solid var(--color-border, #3a3a3a); border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 12px; line-height: 1.4; }
		.hubb-nav:hover:not(:disabled) { border-color: var(--color-accent, #4a9eff); color: var(--color-accent, #4a9eff); }
		.hubb-nav:disabled { opacity: .35; cursor: default; }
		.hubb-nav-active { border-color: var(--color-accent, #4a9eff); color: var(--color-accent, #4a9eff); }
		.hubb-cal-label { font-weight: 400; font-size: 12px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 4px; }
		.hubb-cal-dow { text-align: center; font-size: 10px; color: var(--color-subtle_text, #9aa0a6); padding-bottom: 2px; }
		.hubb-cal-cell { min-height: 46px; border-radius: 4px; border: 1px solid transparent; background: rgba(128,128,128,.07); padding: 3px 4px; display: flex; flex-direction: column; cursor: pointer; overflow: hidden; }
		.hubb-cal-cell:hover { border-color: var(--color-accent, #4a9eff); }
		.hubb-cal-out { opacity: .45; }
		.hubb-cal-today { border-color: var(--color-accent, #4a9eff); }
		.hubb-cal-selected { background: rgba(74,158,255,.18); }
		.hubb-cal-missing { background: rgba(128,128,128,.04); }
		.hubb-cal-missing .hubb-cal-val { color: var(--color-subtle_text, #9aa0a6); font-size: 9px; }
		.hubb-cal-future { opacity: .3; }
		.hubb-cal-day { font-size: 10px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-cal-val { font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
		.hubb-cal-zero { color: var(--color-subtle_text, #9aa0a6); opacity: .6; }
		.hubb-cal-bar { display: flex; height: 4px; border-radius: 2px; overflow: hidden; margin-top: auto; }
		.hubb-cal-seg { height: 100%; }
		.hubb-cal-detail { margin-top: 8px; font-size: 12px; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-cal-detail b { color: var(--color-text, #e6e6e6); }
		.hubb-cal-detail-cats { margin-left: 8px; }
		.hubb-install-note { font-size: 10px; color: var(--color-subtle_text, #9aa0a6); margin-bottom: 6px; }
		.hubb-line { width: 100%; height: auto; display: block; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-help { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; margin-left: 4px; border-radius: 50%; border: 1px solid var(--color-border, #3a3a3a); color: var(--color-subtle_text, #9aa0a6); font-size: 10px; font-weight: 700; cursor: pointer; user-select: none; vertical-align: middle; }
		.hubb-help:hover { border-color: var(--color-accent, #4a9eff); color: var(--color-accent, #4a9eff); }
		.hubb-helpbox { margin: 2px 0 10px; padding: 6px 9px; border-left: 2px solid var(--color-accent, #4a9eff); background: rgba(74,158,255,.08); border-radius: 0 4px 4px 0; font-size: 11px; line-height: 1.6; color: var(--color-subtle_text, #b8bec8); }
		.hubb-select { padding: 3px 6px; font-size: 12px; }
		.hubb-cal-nav-right { display: flex; justify-content: flex-end; margin-bottom: 6px; }
		.hubb-badge-click { cursor: pointer; }
		.hubb-rating-dialog { padding: 16px 18px; font-size: 13px; line-height: 1.6; color: var(--color-text, #e6e6e6); max-height: 70vh; overflow-y: auto; }
		.hubb-rating-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
		.hubb-rating-table th, .hubb-rating-table td { border-bottom: 1px solid var(--color-border, #3a3a3a); padding: 6px 8px; text-align: left; }
		.hubb-rating-table th { color: var(--color-subtle_text, #9aa0a6); font-weight: 600; }
		.hubb-rt-range { font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--color-subtle_text, #9aa0a6); }
		.hubb-rating-tags, .hubb-rating-note { font-size: 12px; color: var(--color-subtle_text, #9aa0a6); }
	`;

	// ------------------------------------------------------------
	// 面板
	// ------------------------------------------------------------
	const TEMPLATE = `
		<div class="hubb-panel" v-if="snap">
			<div class="hubb-head">
				<div>
					<div class="hubb-today">{{ fmt(snap.today.total) }}</div>
					<div class="hubb-today-label">{{ t('today.bigLabel') }}<span class="hubb-help" :title="helpText('rating')" @click="toggleHelp('rating')">?</span></div>
				</div>
				<div class="hubb-badge-wrap">
					<span class="hubb-badge hubb-badge-click" :title="t('rating.viewStandard')" @click="openRatingHelp">{{ snap.today.rating.title }}</span>
					<span class="hubb-tags">
						<span class="hubb-tag" v-for="tag in snap.today.rating.tags" :key="tag">{{ tag }}</span>
					</span>
					<div class="hubb-note">{{ snap.today.rating.desc }}</div>
				</div>
				<div class="hubb-donut" :style="{ background: snap.today.donut }">
					<div class="hubb-donut-hole"><span>{{ snap.today.donutLabel }}</span></div>
				</div>
			</div>
			<div class="hubb-helpbox" v-if="help.rating">{{ helpText('rating') }}</div>

			<div class="hubb-card">
				<div class="hubb-card-title">{{ t('today.categories') }} <span class="hubb-help" :title="helpText('today')" @click="toggleHelp('today')">?</span></div>
				<div class="hubb-helpbox" v-if="help.today">{{ helpText('today') }}</div>
				<div class="hubb-cat" v-for="c in snap.today.cats" :key="c.id">
					<span class="hubb-cat-name">{{ c.label }}</span>
					<div class="hubb-track" :title="c.label + ' · ' + c.pct + '%'"><div class="hubb-track-fill" :style="{ width: c.pct + '%', background: c.color }"></div></div>
					<span class="hubb-cat-time">{{ fmt(c.seconds) }}</span>
					<span class="hubb-cat-pct">{{ c.pct }}%</span>
				</div>
				<div class="hubb-idle" v-if="snap.today.idle > 0">{{ t('today.idle', { time: fmt(snap.today.idle) }) }}</div>
			</div>

			<div class="hubb-card">
				<div class="hubb-card-title hubb-flex">
					<span>{{ t('trend.title') }}
						<span class="hubb-help" :title="helpText('trend')" @click="toggleHelp('trend')">?</span>
					</span>
					<span class="hubb-range">
						<select class="hubb-input hubb-select" v-model="trendView">
							<option value="week">{{ t('trend.week') }}</option>
							<option value="calendar">{{ t('trend.calendar') }}</option>
							<option value="history">{{ t('trend.history') }}</option>
						</select>
						<template v-if="trendView === 'history'">
							<button class="hubb-nav" :class="{ 'hubb-nav-active': historyRange === '30' }" @click="setRange('30')">{{ t('trend.range30') }}</button>
							<button class="hubb-nav" :class="{ 'hubb-nav-active': historyRange === 'all' }" @click="setRange('all')">{{ t('trend.rangeAll') }}</button>
						</template>
					</span>
				</div>
				<div class="hubb-helpbox" v-if="help.trend">{{ helpText('trend') }}</div>

				<div v-if="trendView === 'week'">
					<div class="hubb-week">
						<div class="hubb-wday" v-for="d in snap.week" :key="d.date">
							<div class="hubb-wbar">
								<div class="hubb-wseg" v-for="s in d.segments" :key="s.id" :style="{ height: s.h + '%', background: s.color }" :title="s.title"></div>
							</div>
							<div class="hubb-wlabel" :class="{ 'hubb-wlabel-today': d.isToday }">{{ d.label }}</div>
						</div>
					</div>
					<div class="hubb-week-sum">{{ t('trend.weekSum', { time: fmt(snap.weekTotal) }) }}（{{ t('trend.weekNote') }}）</div>
				</div>

				<div v-else-if="trendView === 'calendar'">
					<div class="hubb-cal-nav hubb-cal-nav-right">
						<button class="hubb-nav" @click="prevMonth" :title="t('calendar.prev')">‹</button>
						<span class="hubb-cal-label">{{ snap.calendar.label }}</span>
						<button class="hubb-nav" @click="nextMonth" :title="t('calendar.next')" :disabled="snap.calendar.isCurrentMonth">›</button>
					</div>
					<div class="hubb-cal">
						<div class="hubb-cal-dow" v-for="d in snap.calendar.dow" :key="d">{{ d }}</div>
						<div class="hubb-cal-cell" v-for="c in snap.calendar.cells" :key="c.date"
							:class="{
								'hubb-cal-out': !c.inMonth,
								'hubb-cal-today': c.isToday,
								'hubb-cal-missing': c.missing,
								'hubb-cal-future': c.future,
								'hubb-cal-selected': c.date === selectedDate
							}"
							:title="c.tooltip"
							@click="selectDay(c)">
							<div class="hubb-cal-day">{{ c.day }}</div>
							<div class="hubb-cal-val" v-if="c.missing">{{ t('calendar.missing') }}</div>
							<div class="hubb-cal-val" v-else-if="c.future"></div>
							<div class="hubb-cal-val" v-else-if="c.total > 0">{{ fmt(c.total) }}</div>
							<div class="hubb-cal-val hubb-cal-zero" v-else>0</div>
							<div class="hubb-cal-bar" v-if="!c.missing && !c.future && c.total > 0">
								<div class="hubb-cal-seg" v-for="s in c.segs" :key="s.id" :style="{ width: s.pct + '%', background: s.color }"></div>
							</div>
						</div>
					</div>
					<div class="hubb-cal-detail" v-if="snap.calendar.selected">
						<b>{{ snap.calendar.selected.date }}</b>
						<template v-if="snap.calendar.selected.missing">{{ t('calendar.missingDetail') }}</template>
						<template v-else-if="snap.calendar.selected.future">{{ t('calendar.futureDetail') }}</template>
						<template v-else>
							{{ t('calendar.sep') }}{{ fmt(snap.calendar.selected.total) }}
							<span class="hubb-cal-detail-cats">
								<span v-for="c in snap.calendar.selected.cats" :key="c.id" v-if="c.seconds > 0">{{ c.label }} {{ c.pct }}%&nbsp;&nbsp;</span>
							</span>
						</template>
					</div>
				</div>

				<div v-else>
					<div class="hubb-install-note">{{ snap.history.note }}</div>
					<svg class="hubb-line" viewBox="0 0 1000 180">
						<path :d="snap.history.area" fill="rgba(74,158,255,0.16)" stroke="none"></path>
						<path :d="snap.history.path" fill="none" stroke="#4a9eff" stroke-width="2"></path>
						<circle v-for="p in snap.history.points" :key="p.label" :cx="p.x" :cy="p.y" r="3" fill="#4a9eff">
							<title>{{ p.label }}{{ t('calendar.sep') }}{{ p.text }}</title>
						</circle>
						<text v-for="l in snap.history.yLabels" :key="'y' + l.y" x="0" :y="l.y" fill="currentColor" font-size="13" opacity="0.55">{{ l.text }}</text>
						<text v-for="l in snap.history.xLabels" :key="'x' + l.x" :x="l.x" y="174" fill="currentColor" font-size="13" opacity="0.55" :text-anchor="l.anchor">{{ l.text }}</text>
					</svg>
					<div class="hubb-empty" v-if="snap.history.days === 0">{{ t('trend.empty') }}</div>
				</div>
			</div>

			<div class="hubb-card" v-if="snap.current">
				<div class="hubb-card-title">{{ t('project.title') }}{{ snap.current.name }}<span class="hubb-dim" v-if="snap.current.identifier"> · {{ snap.current.identifier }}</span> <span class="hubb-help" :title="helpText('project')" @click="toggleHelp('project')">?</span></div>
				<div class="hubb-helpbox" v-if="help.project">{{ helpText('project') }}</div>
				<div class="hubb-proj-line">
					<div class="hubb-proj-total">{{ fmt(snap.current.total) }}</div>
					<div class="hubb-proj-cost">{{ t('project.cost') }} {{ money(snap.current.cost) }}</div>
				</div>
				<div class="hubb-hint" v-if="!snap.current.rateUniform">{{ snap.current.rateText }}</div>
				<div class="hubb-cat" v-for="c in snap.current.cats" :key="c.id">
					<span class="hubb-cat-name">{{ c.label }}</span>
					<div class="hubb-track" :title="c.label + ' · ' + c.pct + '%'"><div class="hubb-track-fill" :style="{ width: c.pct + '%', background: c.color }"></div></div>
					<span class="hubb-cat-time">{{ fmt(c.seconds) }}</span>
					<span class="hubb-cat-pct">{{ c.pct }}%</span>
				</div>
				<div class="hubb-row">
					<label>{{ t('project.rateLabel') }}</label>
					<input class="hubb-input" type="number" min="0" step="1" :value="snap.current.rateOverride" :placeholder="t('project.ratePlaceholder')" @change="onRateChange">
					<span class="hubb-hint">{{ t('project.rateHint', { rate: money(snap.current.globalRate) }) }}</span>
				</div>
			</div>
			<div class="hubb-card" v-else>
				<div class="hubb-card-title">{{ t('project.title') }}</div>
				<div class="hubb-empty">{{ t('project.empty') }}</div>
			</div>

			<div class="hubb-card">
				<div class="hubb-card-title">{{ t('ranking.title') }} <span class="hubb-dim">{{ t('ranking.count', { count: snap.projectCount }) }}</span> <span class="hubb-help" :title="helpText('ranking')" @click="toggleHelp('ranking')">?</span></div>
				<div class="hubb-helpbox" v-if="help.ranking">{{ helpText('ranking') }}</div>
				<div class="hubb-rank" v-for="(p, i) in snap.ranking" :key="p.key">
					<span class="hubb-rank-no">{{ i + 1 }}</span>
					<span class="hubb-rank-name" :title="p.path">{{ p.name }}<span class="hubb-rank-id" v-if="p.identifier"> · {{ p.identifier }}</span></span>
					<span class="hubb-rank-time">{{ fmt(p.total) }}</span>
					<span class="hubb-rank-cost">{{ money(p.cost) }}</span>
				</div>
				<div class="hubb-empty" v-if="!snap.ranking.length">{{ t('ranking.empty') }}</div>
			</div>

			<div class="hubb-card">
				<div class="hubb-card-title">{{ t('settings.title') }} <span class="hubb-help" :title="helpText('settings')" @click="toggleHelp('settings')">?</span></div>
				<div class="hubb-helpbox" v-if="help.settings">{{ helpText('settings') }}</div>
				<div class="hubb-grid">
					<div class="hubb-field"><label>{{ t('settings.language') }}</label><select class="hubb-input" v-model="settings.language" @change="onSettingChange">
						<option v-for="o in languageOptions" :key="o.v" :value="o.v">{{ t(o.k) }}</option>
					</select></div>
					<div class="hubb-field"><label>{{ t('settings.hourly') }}</label><input class="hubb-input" type="number" min="0" step="1" v-model.number="settings.hourly_rate" @change="onSettingChange"></div>
					<div class="hubb-field"><label>{{ t('settings.currency') }}</label><input class="hubb-input" type="text" maxlength="3" v-model="settings.currency" @change="onSettingChange"></div>
					<div class="hubb-field"><label>{{ t('settings.idle') }}</label><select class="hubb-input" v-model.number="settings.idle_seconds" @change="onSettingChange">
						<option v-for="o in idleOptions" :key="o.v" :value="o.v">{{ t(o.l) }}</option>
					</select></div>
					<div class="hubb-field"><label>{{ t('settings.ratingStyle') }} <span class="hubb-help" :title="t('rating.viewStandard')" @click="openRatingHelp">?</span></label><select class="hubb-input" v-model="settings.rating_style" @change="onSettingChange">
						<option value="fun">{{ t('settings.ratingFun') }}</option>
						<option value="serious">{{ t('settings.ratingSerious') }}</option>
					</select></div>
					<div class="hubb-field"><label>{{ t('settings.rounding') }}</label><select class="hubb-input" v-model="settings.rounding" @change="onSettingChange">
						<option value="minute">{{ t('settings.roundMinute') }}</option>
						<option value="half_hour_up">{{ t('settings.roundHalfHour') }}</option>
						<option value="hour_up">{{ t('settings.roundHour') }}</option>
					</select></div>
					<div class="hubb-field"><label>{{ t('settings.minFee') }}</label><input class="hubb-input" type="number" min="0" step="1" v-model.number="settings.min_fee" @change="onSettingChange"></div>
					<div class="hubb-field hubb-check"><label><input type="checkbox" v-model="settings.other_billable" @change="onSettingChange"> {{ t('settings.otherBillable') }}</label></div>
					<div class="hubb-field"><label>{{ t('settings.rateModel') }}</label><input class="hubb-input" type="number" min="0" step="1" v-model.number="settings.rate_model" :placeholder="t('settings.ratePlaceholder')" @change="onSettingChange"></div>
					<div class="hubb-field"><label>{{ t('settings.rateTexture') }}</label><input class="hubb-input" type="number" min="0" step="1" v-model.number="settings.rate_texture" :placeholder="t('settings.ratePlaceholder')" @change="onSettingChange"></div>
					<div class="hubb-field"><label>{{ t('settings.rateAnimate') }}</label><input class="hubb-input" type="number" min="0" step="1" v-model.number="settings.rate_animate" :placeholder="t('settings.ratePlaceholder')" @change="onSettingChange"></div>
					<div class="hubb-field"><label>{{ t('settings.rateOther') }}</label><input class="hubb-input" type="number" min="0" step="1" v-model.number="settings.rate_other" :placeholder="t('settings.ratePlaceholder')" @change="onSettingChange"></div>
				</div>
				<div class="hubb-actions">
					<button class="hubb-btn" @click="exportData">{{ t('buttons.export') }}</button>
					<button class="hubb-btn" @click="importData">{{ t('buttons.import') }}</button>
					<button class="hubb-btn" @click="copyQuote">{{ t('buttons.copyQuote') }}</button>
					<button class="hubb-btn hubb-btn-danger" @click="clearData">{{ t('buttons.clear') }}</button>
				</div>
				<div class="hubb-foot">
					{{ t('footer.storage') }} ｜ {{ t('footer.version', { v: version, stamp: buildStamp }) }}<br>
					<a class="hubb-link" href="https://www.deepseek.com/" target="_blank" rel="noopener" @click.prevent="openLink('https://www.deepseek.com/')">{{ t('footer.powered') }}</a>{{ t('footer.sep') }}{{ t('footer.creditPrefix') }}<a class="hubb-link" href="https://space.bilibili.com/18095414" target="_blank" rel="noopener" @click.prevent="openLink('https://space.bilibili.com/18095414')">{{ t('footer.creditName') }}</a>{{ t('footer.sep') }}<a class="hubb-link" :href="feedbackUrl" target="_blank" rel="noopener" @click.prevent="openLink(feedbackUrl)">{{ t('footer.feedback') }}</a>
				</div>
			</div>
		</div>
	`;

	let dialog = null;
	let ratingDialog = null;
	let action = null;
	let styles = null;

	function createRatingDialog() {
		ratingDialog = new Dialog({
			id: PLUGIN_ID + '_rating',
			title: t('ratingDialog.title'),
			width: 560,
			buttons: [],
			component: { template: buildRatingTemplate() },
		});
	}

	function createDialog() {
		dialog = new Dialog({
			id: PLUGIN_ID + '_panel',
			title: t('panel.title'),
			width: 780,
			resizable: 'xy',
			buttons: [],
			component: {
				data() {
					const now = new Date();
					return {
						snap: null,
						settings: null,
						version: PLUGIN_VERSION,
						buildStamp: BUILD_STAMP,
						feedbackUrl: FEEDBACK_URL,
						idleOptions: IDLE_OPTIONS,
						timer: null,
						calYear: now.getFullYear(),
						calMonth: now.getMonth(),
						historyRange: 'all',
						trendView: 'week',
						selectedDate: dayKey(now.getTime()),
						help: { today: false, rating: false, trend: false, project: false, ranking: false, settings: false },
						languageOptions: [
							{ v: 'auto', k: 'lang.auto' },
							{ v: 'zh-cn', k: 'lang.zh-cn' },
							{ v: 'zh-tw', k: 'lang.zh-tw' },
							{ v: 'en', k: 'lang.en' },
						],
					};
				},
				created() {
					this.pull();
				},
				mounted() {
					this.timer = setInterval(() => this.pull(), 1000);
					this.pull();
				},
				destroyed() {
					if (this.timer) clearInterval(this.timer);
				},
				methods: {
					pull() {
						this.settings = data.settings;
						this.snap = buildSnapshot({
							year: this.calYear,
							month: this.calMonth,
							range: this.historyRange,
							selected: this.selectedDate,
						});
					},
					fmt,
					money: fmtMoney,
					t,
					toggleHelp(key) {
						if (this.help[key] === undefined) this.$set(this.help, key, false);
						this.help[key] = !this.help[key];
					},
					helpText(key) {
						return t('help.' + key);
					},
					openRatingHelp() {
						if (ratingDialog) {
							try { ratingDialog.close(); } catch (err) { /* ignore */ }
							try { if (typeof ratingDialog.delete === 'function') ratingDialog.delete(); } catch (err) { /* ignore */ }
							ratingDialog = null;
						}
						createRatingDialog();
						if (ratingDialog) ratingDialog.show();
					},
					prevMonth() {
						let m = this.calMonth - 1, y = this.calYear;
						if (m < 0) { m = 11; y--; }
						this.calMonth = m;
						this.calYear = y;
						this.pull();
					},
					nextMonth() {
						if (this.snap && this.snap.calendar.isCurrentMonth) return;
						let m = this.calMonth + 1, y = this.calYear;
						if (m > 11) { m = 0; y++; }
						this.calMonth = m;
						this.calYear = y;
						this.pull();
					},
					setRange(r) {
						this.historyRange = r;
						this.pull();
					},
					selectDay(cell) {
						if (!cell) return;
						this.selectedDate = cell.date;
						this.pull();
					},
					onSettingChange() {
						normalizeSettingsInPlace();
						markDirty();
						saveData(true);
						this.pull();
					},
					onRateChange(e) {
						const info = projectInfo();
						if (!info) return;
						const rec = data.projects[info.key];
						if (!rec) return;
						const raw = e && e.target ? e.target.value : '';
						const n = raw === '' ? null : Number(raw);
						rec.rate = (n === null || !isFinite(n) || n < 0) ? null : n;
						markDirty();
						saveData(true);
						this.pull();
					},
					exportData() { exportData(); },
					importData() {
						importData(() => this.pull());
					},
					copyQuote() {
						const q = projectQuote();
						if (!q) {
							Blockbench.showQuickMessage(t('toast.noProject'), 2500);
							return;
						}
						copyText(q.text)
							.then(() => Blockbench.showQuickMessage(t('toast.copied'), 2000))
							.catch(() => Blockbench.showQuickMessage(t('toast.copyFail'), 3000));
					},
					clearData() { resetData(); },
					openLink(url) {
						try {
							Blockbench.openLink(url);
						} catch (err) {
							try { window.open(url, '_blank'); } catch (err2) { /* ignore */ }
						}
					},
				},
				template: TEMPLATE,
			},
		});
	}

	function normalizeSettingsInPlace() {
		const s = data.settings;
		s.hourly_rate = Math.max(0, Number(s.hourly_rate) || 0);
		s.idle_seconds = Math.max(0, Number(s.idle_seconds) || 0);
		s.min_fee = Math.max(0, Number(s.min_fee) || 0);
		if (!s.currency) s.currency = '¥';
		if (['fun', 'serious'].indexOf(s.rating_style) < 0) s.rating_style = 'fun';
		if (['minute', 'half_hour_up', 'hour_up'].indexOf(s.rounding) < 0) s.rounding = 'minute';
		s.other_billable = s.other_billable !== false;
		['rate_model', 'rate_texture', 'rate_animate', 'rate_other'].forEach(k => {
			const v = s[k];
			if (v === null || v === undefined || v === '') { s[k] = null; return; }
			const n = Number(v);
			s[k] = (isFinite(n) && n >= 0) ? n : null;
		});
		if (['auto'].concat(LANGUAGES).indexOf(s.language) < 0) s.language = 'auto';
	}

	function refreshPanel() {
		if (dialog && dialog.content_vue && typeof dialog.content_vue.pull === 'function') {
			dialog.content_vue.pull();
		}
	}

	// ------------------------------------------------------------
	// 事件绑定
	// ------------------------------------------------------------
	function bind(target, event, handler, options) {
		target.addEventListener(event, handler, options);
		state.handlers.push({ target, event, handler, options });
	}

	function bindBlockbench(event, handler) {
		const d = Blockbench.on(event, handler);
		state.handlers.push({ deletable: d });
	}

	function unbindAll() {
		for (const h of state.handlers) {
			try {
				if (h.deletable) h.deletable.delete();
				else h.target.removeEventListener(h.event, h.handler, h.options);
			} catch (err) { /* ignore */ }
		}
		state.handlers = [];
	}

	function startTimers() {
		state.lastTick = Date.now();
		state.lastInput = Date.now();
		state.tickTimer = setInterval(tick, 1000);
		state.saveTimer = setInterval(() => saveData(), 15000);
	}

	function stopTimers() {
		if (state.tickTimer) clearInterval(state.tickTimer);
		if (state.saveTimer) clearInterval(state.saveTimer);
		state.tickTimer = null;
		state.saveTimer = null;
	}

	// ------------------------------------------------------------
	// 注册插件
	// ------------------------------------------------------------
	const plugin = Plugin.register(PLUGIN_ID, {
		title: t('panel.title'),
		author: 'local',
		description: t('plugin.description'),
		about: t('plugin.about'),
		icon: 'insights',
		variant: 'desktop',
		version: PLUGIN_VERSION,
		min_version: '5.1.0',
		tags: ['Utility'],

		onload() {
			pruneTmpProjects(30);
			lastSavedRaw = localStorage.getItem(STORAGE_KEY);
			styles = Blockbench.addCSS(CSS);
			createDialog();
			createRatingDialog();

			action = new Action({
				id: PLUGIN_ID + '_open',
				name: t('action.name'),
				description: t('action.desc'),
				icon: 'insights',
				click() {
					dialog.show();
					refreshPanel();
				},
			});
			MenuBar.addAction(action, 'tools');

			// 输入活跃度（捕获阶段，不影响 Blockbench 自己的处理）
			bind(window, 'pointermove', onInput, true);
			bind(window, 'pointerdown', onInput, true);
			bind(window, 'keydown', onInput, true);
			bind(window, 'wheel', onInput, true);
			bind(window, 'touchstart', onInput, true);

			// 焦点/可见性
			bind(window, 'focus', onFocus);
			bind(window, 'blur', onBlur);
			bind(document, 'visibilitychange', onVisibility);
			bind(window, 'beforeunload', () => saveData(true));

			// Blockbench 事件
			bindBlockbench('select_project', () => {
				state.lastTick = Date.now();
				state.lastInput = Date.now();
				const info = projectInfo();
				state.currentKey = info ? info.key : null;
			});
			bindBlockbench('unselect_project', () => { state.currentKey = null; });
			bindBlockbench('close_project', () => { state.currentKey = null; saveData(true); });
			bindBlockbench('new_project', () => { state.currentKey = null; });
			bindBlockbench('save_project', () => { saveData(true); });
			bindBlockbench('before_closing', () => { saveData(true); });

			const info = projectInfo();
			state.currentKey = info ? info.key : null;
			startTimers();
		},

		onunload() {
			stopTimers();
			saveData(true);
			unbindAll();
			if (dialog) {
				try { dialog.close(); } catch (err) { /* ignore */ }
				try { if (typeof dialog.delete === 'function') dialog.delete(); } catch (err) { /* ignore */ }
				dialog = null;
			}
			if (ratingDialog) {
				try { ratingDialog.close(); } catch (err) { /* ignore */ }
				try { if (typeof ratingDialog.delete === 'function') ratingDialog.delete(); } catch (err) { /* ignore */ }
				ratingDialog = null;
			}
			if (action) { try { action.delete(); } catch (err) { /* ignore */ } action = null; }
			if (styles) { try { styles.delete(); } catch (err) { /* ignore */ } styles = null; }
		},
	});

	// 调试/测试用接口（挂在插件对象上，不影响正常使用）
	// 注意：Plugin.register 在"文件名 ≠ 插件 id"等失败场景会返回 undefined，必须判空
	if (plugin) plugin.hubb = {
		getData: () => data,
		saveData,
		tick,
		buildSnapshot,
		getRating,
		calcCost,
		calcProjectCost,
		rateForCategory,
		rateDescription,
		billableSeconds,
		projectRate,
		projectInfo,
		buildCalendar,
		buildHistory,
		dayTotal,
		fmt,
		fmtMoney,
		exportData,
		importData,
		mergeImported,
		projectQuote,
		resetData,
		pruneTmpProjects,
		state,
		version: PLUGIN_VERSION,
		buildStamp: BUILD_STAMP,
		t,
		currentLanguage,
		dictionaries: I18N,
		buildRatingTemplate,
		template: TEMPLATE,
		css: CSS,
	};
})();
