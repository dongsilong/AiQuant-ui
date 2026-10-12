# Graph Report - ruoyi-ui  (2026-09-23)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2660 nodes · 4903 edges · 145 communities (122 shown, 23 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `355b6687`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143

## God Nodes (most connected - your core abstractions)
1. `useDict()` - 32 edges
2. `service` - 31 edges
3. `vue` - 30 edges
4. `AxiosPromise` - 30 edges
5. `download()` - 28 edges
6. `useLoading()` - 27 edges
7. `useSearchReset()` - 27 edges
8. `useSearchToggle()` - 27 edges
9. `useTableSelection()` - 23 edges
10. `compilerOptions` - 22 edges

## Surprising Connections (you probably didn't know these)
- `decrypt()` --references--> `jsencrypt`  [EXTRACTED]
  src/utils/jsencrypt.ts → package.json
- `encrypt()` --references--> `jsencrypt`  [EXTRACTED]
  src/utils/jsencrypt.ts → package.json
- `uploadToOss()` --calls--> `globalHeaders()`  [EXTRACTED]
  src/components/Editor/index.vue → src/utils/request.ts
- `handleAdd()` --calls--> `openDialog()`  [INFERRED]
  src/views/demo/demo/index.vue → src/views/monitor/operlog/operInfoDialog.vue
- `handleAdd()` --calls--> `openDialog()`  [INFERRED]
  src/views/demo/tree/index.vue → src/views/monitor/operlog/operInfoDialog.vue

## Import Cycles
- 3-file cycle: `src/layout/components/Sidebar/index.vue -> src/store/modules/permission.ts -> src/layout/index.vue -> src/layout/components/Sidebar/index.vue`
- 3-file cycle: `src/api/login.ts -> src/utils/push.ts -> src/store/modules/user.ts -> src/api/login.ts`
- 3-file cycle: `src/api/login.ts -> src/utils/request.ts -> src/store/modules/user.ts -> src/api/login.ts`
- 4-file cycle: `src/layout/components/Sidebar/index.vue -> src/store/modules/permission.ts -> src/router/index.ts -> src/layout/index.vue -> src/layout/components/Sidebar/index.vue`
- 4-file cycle: `src/layout/components/Navbar.vue -> src/router/index.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/Navbar.vue`
- 4-file cycle: `src/layout/components/Settings/index.vue -> src/store/modules/permission.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/Settings/index.vue`
- 4-file cycle: `src/layout/components/TagsView/index.vue -> src/store/modules/permission.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/TagsView/index.vue`
- 5-file cycle: `src/layout/components/Navbar.vue -> src/plugins/tab.ts -> src/router/index.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/Navbar.vue`
- 5-file cycle: `src/layout/components/TagsView/index.vue -> src/plugins/tab.ts -> src/router/index.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/TagsView/index.vue`
- 5-file cycle: `src/layout/components/Navbar.vue -> src/layout/components/notice/index.vue -> src/router/index.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/Navbar.vue`
- 5-file cycle: `src/layout/components/Navbar.vue -> src/layout/components/TopBar/index.vue -> src/store/modules/permission.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/Navbar.vue`
- 5-file cycle: `src/layout/components/Navbar.vue -> src/layout/components/TopBar/search.vue -> src/store/modules/permission.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/Navbar.vue`
- 5-file cycle: `src/layout/components/Settings/index.vue -> src/store/modules/permission.ts -> src/router/index.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/Settings/index.vue`
- 5-file cycle: `src/layout/components/TagsView/index.vue -> src/store/modules/permission.ts -> src/router/index.ts -> src/layout/index.vue -> src/layout/components/index.ts -> src/layout/components/TagsView/index.vue`
- 5-file cycle: `src/api/system/message/index.ts -> src/utils/request.ts -> src/router/index.ts -> src/layout/index.vue -> src/utils/push.ts -> src/api/system/message/index.ts`
- 5-file cycle: `src/api/login.ts -> src/utils/push.ts -> src/api/system/message/index.ts -> src/utils/request.ts -> src/store/modules/user.ts -> src/api/login.ts`

## Communities (145 total, 23 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (54): active(), add(), copy(), deleteDefinition(), edit(), getInfo(), importDef(), listDefinition() (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (52): activeStyle(), affixTags, canScrollLeft, canScrollRight, closeAllTags(), closeLeftTags(), closeMenu(), closeOthersTags() (+44 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (47): cancelProcessApply(), addLeave(), delLeave(), getLeave(), listLeave(), submitAndFlowStart(), updateLeave(), LeaveForm (+39 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (48): addNotice(), delNotice(), getNotice(), listNotice(), updateNotice(), NoticeForm, NoticeQuery, NoticeVO (+40 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (46): deleteHisByInstanceIds(), instanceVariable(), invalid(), pageByFinish(), pageByRunning(), updateVariable(), FlowInstanceQuery, FlowInstanceVO (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (49): animate.css, await-to-js, axios, crypto-js, echarts, element-plus, @element-plus/icons-vue, highlight.js (+41 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (42): roleMenuTreeselect(), applyMenuTreeCheckedState(), buildMenuPermissionMeta(), buildRoleMenuPermissionOptions(), data, dataScopeOptions, dataScopeRef, { dateRange, applyDateRange, resetDateRange } (+34 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (30): activeRoutes(), handleSelect(), isExt, props, type, onlyOneChild, props, resolvePath() (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (37): optionselect(), useTreeCollapsed(), cancel(), columns, data, { dateRange, applyDateRange, resetDateRange }, deptOptions, { dialog, openDialog: openUserDialog, closeDialog: closeUserDialog, setTitle: setDialogTitle } (+29 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (36): addDept(), delDept(), getDept(), listDept(), listDeptExcludeChild(), updateDept(), DeptForm, DeptQuery (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (31): getBackTaskNode(), getNextNodeList(), backButtonDisabled, backForm, backLoading, backVisible, buttonDisabled, buttonObj (+23 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (37): DOM, ESNext, node, node_modules, src/**/*.d.ts, src/**/__tests__/*, src/**/*.ts, src/**/*.vue (+29 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (33): addTree(), delTree(), getTree(), listTree(), updateTree(), TreeForm, TreeQuery, TreeVO (+25 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (29): pageByAllTaskFinish(), pageByAllTaskWait(), updateAssignee(), urgeTask(), applyUserSelectRef, buttonType, changeTab(), getFinishList() (+21 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (32): addConfig(), delConfig(), getConfig(), listConfig(), refreshCache(), updateConfig(), updateConfigByKey(), ConfigForm (+24 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (31): addOssConfig(), changeOssConfigStatus(), delOssConfig(), getOssConfig(), listOssConfig(), updateOssConfig(), OssConfigForm, OssConfigQuery (+23 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (32): addPost(), delPost(), deptTreeSelect(), getPost(), listPost(), updatePost(), PostForm, PostQuery (+24 more)

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (33): categories, correctness, suspicious, ignorePatterns, .ai_state, .claude, .codex, dist/** (+25 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (31): addCategory(), delCategory(), getCategory(), listCategory(), updateCategory(), CategoryForm, CategoryQuery, CategoryTreeVO (+23 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (25): emit, toggleClick(), height, loading, props, url, props, realHeight (+17 more)

### Community 20 - "Community 20"
Cohesion: 0.06
Nodes (31): currentDict, currentDictLabel, dataDialog, dataFormRef, dataIds, dataInitFormData, dataList, dataLoading (+23 more)

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (29): addClient(), changeStatus(), delClient(), listClient(), updateClient(), ClientForm, ClientQuery, ClientVO (+21 more)

### Community 22 - "Community 22"
Cohesion: 0.07
Nodes (27): getConfigKey(), listOss(), buttonLoading, data, {
  dateRange: dateRangeCreateTime,
  applyDateRange: applyCreateTimeDateRange,
  resetDateRange: resetCreateTimeDateRange
}, defaultSort, {
  dialog,
  resetForm: reset,
  openDialog,
  closeDialog
}, getList() (+19 more)

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (24): getRouters(), activeMenu, appStore, childrenMenus, hideList, permissionStore, route, router (+16 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (28): getMessageBox(), MessageBoxVO, MessageVO, NoticeItem, useNoticeStore, isMessageRead(), appendNotice(), buildSseUrl() (+20 more)

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (19): getAuthRole(), getUser(), updateAuthRole(), UserForm, parseStrEmpty(), checkSelectable(), clickRow(), close() (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.06
Nodes (30): CheckboxValueType, DateModelType, ElCardInstance, ElCascaderInstance, ElCheckboxGroupInstance, ElCheckboxInstance, ElColorPickerInstance, ElDatePickerInstance (+22 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (26): addDemo(), delDemo(), getDemo(), listDemo(), updateDemo(), DemoForm, DemoQuery, DemoVO (+18 more)

### Community 28 - "Community 28"
Cohesion: 0.10
Nodes (26): cleanOperlog(), delOperlog(), list(), OperLogQuery, OperLogVO, handleSelectionChange(), data, { dateRange, applyDateRange, resetDateRange } (+18 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (25): delTable(), listTable(), previewTable(), synchDb(), dataNameList, { dateRange, applyDateRange, resetDateRange }, { dialog, openDialog: openPreviewDialog }, getList() (+17 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (26): addSpel(), delSpel(), listSpel(), updateSpel(), SpelForm, SpelQuery, SpelVO, data (+18 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (17): NavTypeEnum, SideThemeEnum, appStore, dynamicTitleChange(), isDark, navType, permissionStore, predefineColors (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (26): cleanLoginInfo(), delLoginInfo(), list(), unlockLoginInfo(), LoginInfoQuery, LoginInfoVO, PageResult, { dateRange, applyDateRange, resetDateRange } (+18 more)

### Community 33 - "Community 33"
Cohesion: 0.07
Nodes (21): DeptVO, computedIds(), confirm(), { dateRange, applyDateRange, resetDateRange }, defaultSelectUserIds, deptName, deptOptions, deptTreeRef (+13 more)

### Community 34 - "Community 34"
Cohesion: 0.08
Nodes (21): confirm(), { dateRange, applyDateRange, resetDateRange }, defaultSelectRoleIds, { dialog, openDialog, closeDialog }, emit, getList(), handleQuery(), loading (+13 more)

### Community 35 - "Community 35"
Cohesion: 0.10
Nodes (19): addIframe(), animate, route, tagsViewStore, route, tagsViewStore, closeAllPage(), closeLeftPage() (+11 more)

### Community 36 - "Community 36"
Cohesion: 0.08
Nodes (20): appStore, appStore, { locale }, message, appStore, size, sizeOptions, classObj (+12 more)

### Community 37 - "Community 37"
Cohesion: 0.08
Nodes (23): data, deleteLoading, {
  dialog: deleteDialog,
  openDialog: openDeleteDialog,
  closeDialog: closeDeleteDialog
}, { dialog, openDialog, closeDialog, setTitle }, getChildrenList(), initFormData, { loading, withLoading }, menuChildrenListMap (+15 more)

### Community 38 - "Community 38"
Cohesion: 0.08
Nodes (24): animateList, logoAnimate, menuSearchAnimate, searchAnimate, activeMenu, appStore, bgColor, isCollapse (+16 more)

### Community 39 - "Community 39"
Cohesion: 0.10
Nodes (22): addRole(), changeRoleStatus(), delRole(), deptTreeSelect(), listRole(), updateRole(), updateRolePermission(), DeptTreeOption (+14 more)

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (23): categoryTree(), deleteByInstanceIds(), pageByCurrent(), getTreeselect(), getTreeselect(), categoryOptions, getList(), getTreeselect() (+15 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (19): axios, oss(), printErrMsg(), zip(), CryptoJS, decryptBase64(), decryptWithAes(), encryptBase64() (+11 more)

### Community 42 - "Community 42"
Cohesion: 0.16
Nodes (25): buildCheckedButtonPermissionIds(), cancelDataScope(), collectButtonPermissionIds(), collectMenuNodeIds(), getCheckedMenuKeys(), getDerivedMenuIdsFromButtons(), getMenuAllCheckedKeys(), getPermissionStateIds() (+17 more)

### Community 43 - "Community 43"
Cohesion: 0.11
Nodes (21): currentTaskAllUser(), getTask(), terminationTask(), addMultiInstanceUser(), buttonDisabled, deleteMultiInstanceUser(), deleteSignatureVisible, deleteUserList (+13 more)

### Community 44 - "Community 44"
Cohesion: 0.09
Nodes (18): pageByTaskWait(), displayText, props, useSearchToggle(), getWaitingList(), handleQuery(), { ids, single, multiple, handleSelectionChange }, { loading, withLoading } (+10 more)

### Community 45 - "Community 45"
Cohesion: 0.09
Nodes (22): arrowParens, experimentalSortPackageJson, sortScripts, htmlWhitespaceSensitivity, ignorePatterns, .ai_state, .claude, .codex (+14 more)

### Community 46 - "Community 46"
Cohesion: 0.12
Nodes (18): listByIds(), OssForm, OssQuery, OssUploadVO, OssVO, SysOssExt, flowHisTaskList(), decodeOssContent() (+10 more)

### Community 47 - "Community 47"
Cohesion: 0.11
Nodes (19): allocatedUserList(), authUserCancel(), authUserCancelAll(), useLoading(), cancelAuthUser(), cancelAuthUserAll(), getList(), handleQuery() (+11 more)

### Community 48 - "Community 48"
Cohesion: 0.10
Nodes (18): pageByTaskFinish(), isSelectableId(), useTableSelection(), getFinishList(), handleQuery(), { ids, single, multiple, handleSelectionChange }, { loading, withLoading }, queryFormRef (+10 more)

### Community 49 - "Community 49"
Cohesion: 0.12
Nodes (16): pageByTaskCopy(), RouterJumpVo, StartProcessBo, useSearchReset(), UseSearchResetOptions, getTaskCopyList(), handleQuery(), { ids, single, multiple, handleSelectionChange } (+8 more)

### Community 50 - "Community 50"
Cohesion: 0.11
Nodes (17): dialogImageUrl, dialogVisible, emit, fileAccept, fileList, handleDelete(), handleUploadSuccess(), headers (+9 more)

### Community 51 - "Community 51"
Cohesion: 0.18
Nodes (21): applyTableHeight(), applyTableHeightValue(), calculateTableHeight(), canManageTable(), getBodyWrapper(), getBottomPadding(), getFollowingHeight(), getManagedTables() (+13 more)

### Community 52 - "Community 52"
Cohesion: 0.13
Nodes (17): registerCurrentSnailUser(), iframeUrl, props, getToken(), removeToken(), setToken(), tokenStorage, buildChatUrl() (+9 more)

### Community 53 - "Community 53"
Cohesion: 0.12
Nodes (16): delOss(), emit, fileAccept, fileList, fileUploadRef, handleDelete(), handleUploadSuccess(), headers (+8 more)

### Community 54 - "Community 54"
Cohesion: 0.12
Nodes (18): authUserSelectAll(), unallocatedUserList(), UserQuery, emit, getList(), handleQuery(), handleSelectUser(), props (+10 more)

### Community 55 - "Community 55"
Cohesion: 0.13
Nodes (18): getDataNames(), importTable(), listDbTable(), dataNameList, dbTableList, emit, getList(), handleImportTable() (+10 more)

### Community 56 - "Community 56"
Cohesion: 0.11
Nodes (18): collectExpandedKeys(), contentSpan, defaultExpandedKeys, emit, filterText, filterTree, getNodeKey(), { height: treeWrapHeight } (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.11
Nodes (7): addClass(), cleanArray(), formatTime(), hasClass(), param(), removeClass(), parseTime()

### Community 58 - "Community 58"
Cohesion: 0.11
Nodes (9): hasDirective(), isComment(), isConditionalChain(), nodeLabel(), viteCheckTransitionPlugin(), brotliCompress, compressionHandlers, CompressionKind (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (10): SnailOpenApiUser, getCache(), CacheVO, AxiosPromise, service, cache, commandstats, disposeCharts() (+2 more)

### Community 60 - "Community 60"
Cohesion: 0.11
Nodes (17): HttpStatus, captchaEnabled, codeUrl, currentYear, getCode(), handleLogin(), highlights, loading (+9 more)

### Community 61 - "Community 61"
Cohesion: 0.11
Nodes (19): autoprefixer, oxfmt, oxlint, devDependencies, autoprefixer, oxfmt, oxlint, @types/crypto-js (+11 more)

### Community 62 - "Community 62"
Cohesion: 0.11
Nodes (13): content, editorConfig, editorRef, emit, handleCreated(), isResolvingContent, lastEncodedValue, ossUrlToId (+5 more)

### Community 63 - "Community 63"
Cohesion: 0.12
Nodes (8): uploadOss(), cropper, open, Options, title, uploadImg(), userStore, visible

### Community 64 - "Community 64"
Cohesion: 0.15
Nodes (17): getGenTable(), updateGenTable(), DbColumnVO, activeName, basicInfo, close(), columns, DICT_HTML_TYPES (+9 more)

### Community 65 - "Community 65"
Cohesion: 0.14
Nodes (16): getCodeImg(), register(), RegisterForm, captchaEnabled, codeUrl, currentYear, getCode(), handleRegister() (+8 more)

### Community 66 - "Community 66"
Cohesion: 0.21
Nodes (14): forceLogout(), list(), OnlineQuery, OnlineVO, getList(), handleForceLogout(), handleQuery(), loading (+6 more)

### Community 67 - "Community 67"
Cohesion: 0.19
Nodes (15): activeTab, currentNewsList, emptyDescription, newsList, noticeStore, onNewsClick(), readAll(), state (+7 more)

### Community 69 - "Community 69"
Cohesion: 0.15
Nodes (9): OperLogForm, selectDictLabel(), tansParams(), typeFormat(), deviceTypeFormat(), info, open, { sys_oper_type, sys_device_type } (+1 more)

### Community 70 - "Community 70"
Cohesion: 0.13
Nodes (11): appStore, commandMap, displayName, emits, navType, noticeStore, searchMenuRef, setLayout() (+3 more)

### Community 71 - "Community 71"
Cohesion: 0.13
Nodes (14): author, description, engines, node, pnpm, license, name, packageManager (+6 more)

### Community 72 - "Community 72"
Cohesion: 0.19
Nodes (13): addType(), delType(), listType(), optionselect(), updateType(), DictTypeForm, DictTypeQuery, DictTypeVO (+5 more)

### Community 73 - "Community 73"
Cohesion: 0.18
Nodes (11): applyCustomIcon(), customIcon, emit, filterValue, iconNames, { modelValue, width }, props, selectedIcon() (+3 more)

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (10): applyTransform(), getBounds(), handleMouseMove(), handleMouseWheel(), imageWrapperRef, props, resetDragPosition(), resetTransform() (+2 more)

### Community 75 - "Community 75"
Cohesion: 0.19
Nodes (13): buttonDisabled, cancel(), close(), emits, form, loading, open(), props (+5 more)

### Community 76 - "Community 76"
Cohesion: 0.19
Nodes (12): LanguageEnum, BaseEntity, ComponentInternalInstance, DefaultSettings, DialogOption, DictDataOption, FieldOption, ImportOption (+4 more)

### Community 77 - "Community 77"
Cohesion: 0.14
Nodes (14): download(), handleExport(), handleExport(), handleExport(), handleExport(), handleExport(), handleDataExport(), handleTypeExport() (+6 more)

### Community 78 - "Community 78"
Cohesion: 0.24
Nodes (12): callback(), callbackByCode(), code, handleError(), init(), loading, loginByCode(), processResponse() (+4 more)

### Community 79 - "Community 79"
Cohesion: 0.17
Nodes (11): listMenu(), availableColumns, formRef, frontendTypeOptions, getMenuTreeselect(), infoForm, menuOptions, MenuOptionsType (+3 more)

### Community 80 - "Community 80"
Cohesion: 0.27
Nodes (11): currentPage, emit, handleCurrentChange(), handleSizeChange(), pageSize, props, easeInOutQuad(), move() (+3 more)

### Community 81 - "Community 81"
Cohesion: 0.28
Nodes (11): authPermission(), authRole(), hasPermi(), hasPermiAnd(), hasPermiOr(), hasRole(), hasRoleAnd(), hasRoleOr() (+3 more)

### Community 82 - "Community 82"
Cohesion: 0.29
Nodes (6): vue, hasPermi, hasRoles, app, installPlugin(), store

### Community 83 - "Community 83"
Cohesion: 0.35
Nodes (8): getInfo(), login(), logout(), UserInfo, LoginData, LoginResult, VerifyCodeResult, RuoYiAjaxResult

### Community 84 - "Community 84"
Cohesion: 0.23
Nodes (11): getOnline(), getAuthList(), getUserProfile(), UserVO, PropType, activeTab, getAuths(), getOnlines() (+3 more)

### Community 85 - "Community 85"
Cohesion: 0.32
Nodes (8): MenuForm, MenuQuery, MenuTreeOption, MenuVO, RoleMenuButtonOption, RoleMenuTree, MenuTypeEnum, RoleMenuPermissionOption

### Community 86 - "Community 86"
Cohesion: 0.17
Nodes (10): info, loading, postIds, postNames, postOptions, roleIds, roleNames, roleOptions (+2 more)

### Community 87 - "Community 87"
Cohesion: 0.20
Nodes (9): updateUserProfile(), UserProfileForm, props, rule, rules, submit(), { sys_user_gender }, userForm (+1 more)

### Community 88 - "Community 88"
Cohesion: 0.20
Nodes (10): getClient(), getSpel(), cancel(), handleUpdate(), cancel(), cancel(), closeDialog(), resetForm() (+2 more)

### Community 89 - "Community 89"
Cohesion: 0.33
Nodes (8): DbColumnForm, DbParamForm, DbTableForm, DbTableQuery, DbTableVO, GenTableDetailPayload, TableQuery, TableVO

### Community 90 - "Community 90"
Cohesion: 0.27
Nodes (8): findPathNum(), getBreadcrumb(), getMatched(), isDashboard(), levelList, permissionStore, route, router

### Community 91 - "Community 91"
Cohesion: 0.27
Nodes (8): approvalButtonShow, approvalVerifyOpen(), emits, handleApprovalRecord(), props, route, submitButtonShow, submitForm()

### Community 92 - "Community 92"
Cohesion: 0.20
Nodes (8): activeMenu, moreRoutes, permissionStore, route, settingsStore, theme, topMenus, visibleNumber

### Community 93 - "Community 93"
Cohesion: 0.20
Nodes (10): handleAdd(), openDialog(), handleAdd(), handleAdd(), handleAdd(), handleAdd(), handleFile(), handleImage() (+2 more)

### Community 94 - "Community 94"
Cohesion: 0.22
Nodes (9): scripts, build, build:dev, build:prod, dev, fmt, lint, lint:fix (+1 more)

### Community 95 - "Community 95"
Cohesion: 0.22
Nodes (9): delData(), listData(), ensureCurrentType(), getDataList(), handleDataDelete(), handleDataQuery(), handleDataResetQuery(), handleTypeRowClick() (+1 more)

### Community 96 - "Community 96"
Cohesion: 0.22
Nodes (9): addMenu(), cascadeDelMenu(), delMenu(), updateMenu(), getList(), handleDelete(), handleQuery(), submitDeleteForm() (+1 more)

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (7): authRouterUrl(), authUnlock(), doSocialLogin(), auths, authUrl(), props, unlockAuth()

### Community 98 - "Community 98"
Cohesion: 0.25
Nodes (6): updateUserPwd(), ResetPwdForm, pwdRef, rules, submit(), user

### Community 99 - "Community 99"
Cohesion: 0.28
Nodes (7): completeTask(), ButtonList, FlowCopyVo, ParticipantVo, TaskOperationBo, TaskQuery, handleCompleteTask()

### Community 100 - "Community 100"
Cohesion: 0.31
Nodes (9): backProcess(), taskOperation(), addMultiInstanceUser(), cancel(), deleteMultiInstanceUser(), emits, handleBackProcess(), handleDelegateTask() (+1 more)

### Community 101 - "Community 101"
Cohesion: 0.31
Nodes (8): columnChange(), columnRef, emits, props, refresh(), saveStorage(), style, toggleSearch()

### Community 102 - "Community 102"
Cohesion: 0.25
Nodes (6): LanguageType, localCache, sessionCache, ComponentCustomProperties, ObjKeysToUnion, vue

### Community 103 - "Community 103"
Cohesion: 0.39
Nodes (6): addData(), updateData(), DictDataForm, DictDataQuery, DictDataVO, submitDataForm()

### Community 104 - "Community 104"
Cohesion: 0.36
Nodes (6): getDicts(), refreshCache(), useDictStore, pendingRequests, useDict(), handleRefreshCache()

### Community 105 - "Community 105"
Cohesion: 0.33
Nodes (7): getMenu(), cancel(), getTreeselect(), handleAdd(), handleCascadeDelete(), handleUpdate(), reset()

### Community 106 - "Community 106"
Cohesion: 0.29
Nodes (4): Props, unmatch, unmatchArray, values

### Community 108 - "Community 108"
Cohesion: 0.57
Nodes (6): themeChange(), getDarkColor(), getLightColor(), handleThemeStyle(), hexToRgb(), rgbToHex()

### Community 109 - "Community 109"
Cohesion: 0.33
Nodes (6): isWhiteList(), NProgress, whiteList, isHandledRequestError(), isRelogin, isPathMatch()

### Community 110 - "Community 110"
Cohesion: 0.29
Nodes (7): formatImportResultMessage(), getList(), handleDelete(), handleFileSuccess(), handleNodeClick(), handleQuery(), submitForm()

### Community 111 - "Community 111"
Cohesion: 0.40
Nodes (5): delOnline(), devices, handldDelOnline(), props, { sys_device_type }

### Community 112 - "Community 112"
Cohesion: 0.33
Nodes (6): getRole(), cancel(), createEmptyMenuPermissionMeta(), handleAdd(), handleUpdate(), reset()

### Community 113 - "Community 113"
Cohesion: 0.33
Nodes (5): ImportMeta, ImportMetaEnv, virtual:*, virtual:svg-icons-register, *.vue

### Community 114 - "Community 114"
Cohesion: 0.33
Nodes (5): _RouteLocationBase, RouteMeta, _RouteRecordBase, TagView, vue-router

### Community 115 - "Community 115"
Cohesion: 0.50
Nodes (4): jsencrypt, jsencrypt, decrypt(), encrypt()

### Community 116 - "Community 116"
Cohesion: 0.40
Nodes (5): browserslist, Chrome >= 87, Edge >= 88, Firefox >= 78, Safari >= 14

### Community 117 - "Community 117"
Cohesion: 0.40
Nodes (5): getData(), cancelData(), handleDataAdd(), handleDataUpdate(), resetDataForm()

### Community 118 - "Community 118"
Cohesion: 0.40
Nodes (5): getType(), cancelType(), handleTypeAdd(), handleTypeUpdate(), resetTypeForm()

### Community 119 - "Community 119"
Cohesion: 0.40
Nodes (5): getList(), handleNodeClick(), handleQuery(), pageList(), resetQuery()

### Community 120 - "Community 120"
Cohesion: 0.40
Nodes (4): TableSortOrder, TableSortState, useTableSortQuery(), UseTableSortQueryOptions

### Community 121 - "Community 121"
Cohesion: 0.40
Nodes (3): errGif, route, router

## Knowledge Gaps
- **1167 isolated node(s):** `$schema`, `src/types/components.d.ts`, `src/types/auto-imports.d.ts`, `.ai_state`, `.claude` (+1162 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `Community 82` to `Community 3`, `Community 4`, `Community 10`, `Community 12`, `Community 17`, `Community 19`, `Community 23`, `Community 24`, `Community 31`, `Community 35`, `Community 36`, `Community 44`, `Community 48`, `Community 49`, `Community 52`, `Community 75`, `Community 76`, `Community 83`, `Community 113`, `Community 120`, `Community 125`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 5` to `Community 115`, `Community 71`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `jsencrypt` connect `Community 115` to `Community 5`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `$schema`, `src/types/components.d.ts`, `src/types/auto-imports.d.ts` to the rest of the system?**
  _1167 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05273937532002048 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05480225988700565 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05202661826981246 - nodes in this community are weakly interconnected._