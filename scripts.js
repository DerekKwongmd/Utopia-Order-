// 数据存储
let contacts = [];
let currentPersonId = null;

// 初始化示例数据
function initSampleData() {
    if (localStorage.getItem('contacts')) {
        contacts = JSON.parse(localStorage.getItem('contacts'));
    } else {
        contacts = [
            {
                id: '1',
                name: '张三',
                level: '外围层',
                environment: '职场',
                score: 35,
                lastContact: '2026-07-28',
                contactInterval: 30,
                nextContact: '2026-08-27',
                notes: ''
            },
            {
                id: '2',
                name: '李四',
                level: '中间层',
                environment: '项目开发',
                score: 45,
                lastContact: '2026-08-01',
                contactInterval: 21,
                nextContact: '2026-08-22',
                notes: ''
            },
            {
                id: '3',
                name: '王五',
                level: '核心层',
                environment: '风险投资',
                score: 55,
                lastContact: '2026-08-05',
                contactInterval: 14,
                nextContact: '2026-08-19',
                notes: ''
            }
        ];
        saveToLocal();
    }
    renderAll();
}

function saveToLocal() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

// 渲染联系人列表
function renderContactList(filteredContacts) {
    const list = document.getElementById('contactList');
    if (!list) return;
    const items = filteredContacts || contacts;
    list.innerHTML = items.map(c => `
        <li class="contact-item ${c.id === currentPersonId ? 'active' : ''}" 
            onclick="selectPerson('${c.id}')">
            <span class="contact-name">${c.name}</span>
            <span class="contact-level">${c.level || '未评级'}</span>
        </li>
    `).join('');
}

// 渲染提醒列表
function renderReminders() {
    const list = document.getElementById('reminderList');
    if (!list) return;
    const today = new Date().toISOString().split('T')[0];
    const reminders = contacts.filter(c => c.nextContact === today);
    
    if (reminders.length === 0) {
        list.innerHTML = '<li class="reminder-item">✅ 今天没有待联系的人</li>';
        return;
    }
    
    list.innerHTML = reminders.map(c => `
        <li class="reminder-item">🔔 今天需要联系 <strong>${c.name}</strong></li>
    `).join('');
}

// 搜索联系人
function searchContacts(keyword) {
    if (!keyword || keyword.trim() === '') {
        renderContactList();
        return;
    }
    const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(keyword.toLowerCase())
    );
    renderContactList(filtered);
}

// 选择联系人
function selectPerson(id) {
    currentPersonId = id;
    const person = contacts.find(c => c.id === id);
    if (!person) return;

    const emptyState = document.getElementById('emptyState');
    const personDetail = document.getElementById('personDetail');
    if (emptyState) emptyState.style.display = 'none';
    if (personDetail) personDetail.classList.add('active');
    
    const nameEl = document.getElementById('personName');
    const lastContactEl = document.getElementById('lastContactDate');
    const intervalEl = document.getElementById('contactInterval');
    const levelEl = document.getElementById('currentLevel');
    const scoreEl = document.getElementById('currentScore');
    const envEl = document.getElementById('environmentSelect');
    const notesEl = document.getElementById('personNotes');
    
    if (nameEl) nameEl.textContent = person.name;
    if (lastContactEl) lastContactEl.value = person.lastContact || '';
    if (intervalEl) intervalEl.value = person.contactInterval || '';
    if (levelEl) levelEl.textContent = person.level || '未评定';
    if (scoreEl) scoreEl.textContent = person.score || 0;
    if (envEl) envEl.value = person.environment || '';
    if (notesEl) notesEl.value = person.notes || '';
    
    updateDaysUntilNext(person);
    renderContactList();

    if (person.environment) {
        recalculateScoreByEnvironment(person);
    }

    const scoringLink = document.getElementById('scoringLink');
    if (scoringLink) {
        const env = person.environment || '';
        scoringLink.href = `scoring.html?id=${id}&name=${encodeURIComponent(person.name)}&env=${encodeURIComponent(env)}`;
    }
}

// 应用筛选
function applyFilters() {
    const firstGroup = document.querySelectorAll('.filter-group:first-child input:checked');
    const lastGroup = document.querySelectorAll('.filter-group:last-child input:checked');
    if (!firstGroup || !lastGroup) return;
    
    const selectedLevels = [...firstGroup].map(i => i.value);
    const selectedEnvironments = [...lastGroup].map(i => i.value);

    let filtered = contacts;
    if (selectedLevels.length > 0) {
        filtered = filtered.filter(c => selectedLevels.includes(c.level));
    }
    if (selectedEnvironments.length > 0) {
        filtered = filtered.filter(c => selectedEnvironments.includes(c.environment));
    }
    renderContactList(filtered);
}

// 应用排序
function applySort(method) {
    let sorted = [...contacts];
    if (method === 'score') {
        sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (method === 'nextContact') {
        sorted.sort((a, b) => (a.nextContact || '').localeCompare(b.nextContact || ''));
    }
    renderContactList(sorted);
}

// 更新距离下次联系天数
function updateDaysUntilNext(person) {
    const el = document.getElementById('daysUntilNext');
    if (!el) return;
    if (person.nextContact) {
        const today = new Date();
        const next = new Date(person.nextContact);
        const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
        el.textContent = diff >= 0 ? `${diff}天` : '已过期';
    } else {
        el.textContent = '-';
    }
}

// 更新联系人信息
function updatePersonInfo() {
    const person = contacts.find(c => c.id === currentPersonId);
    if (!person) return;

    const oldEnv = person.environment;
    const lastContactEl = document.getElementById('lastContactDate');
    const intervalEl = document.getElementById('contactInterval');
    const envEl = document.getElementById('environmentSelect');
    const notesEl = document.getElementById('personNotes');
    
    person.lastContact = lastContactEl ? lastContactEl.value : '';
    person.contactInterval = parseInt(intervalEl ? intervalEl.value : 0) || 0;
    person.environment = envEl ? envEl.value : '';
    person.notes = notesEl ? notesEl.value : '';

    if (oldEnv !== person.environment && person.environment) {
        recalculateScoreByEnvironment(person);
    }

    if (person.lastContact && person.contactInterval) {
        const last = new Date(person.lastContact);
        last.setDate(last.getDate() + person.contactInterval);
        person.nextContact = last.toISOString().split('T')[0];
    }

    saveToLocal();
    updateDaysUntilNext(person);
    renderReminders();
}

// 根据当前环境重新计算分值
function recalculateScoreByEnvironment(person) {
    const savedData = localStorage.getItem(`scoring_${person.id}`);
    if (!savedData) return;

    try {
        const data = JSON.parse(savedData);
        if (!data.scores || data.scores.length === 0) return;

        let userConfig = null;
        const savedConfig = localStorage.getItem('utopia_config');
        if (savedConfig) {
            try {
                userConfig = JSON.parse(savedConfig);
            } catch(e) {}
        }

        const dimNames = userConfig && userConfig.dimNames ? userConfig.dimNames : 
            ['信息筛选能力','决策力','执行力','学习迁移能力','沟通能力','情绪稳定性','抗打击能力','边界感','互惠意识','冲突处理能力','承诺兑现率','专业领域贡献值'];

        let coefMap = null;
        if (userConfig && userConfig.coefficients && userConfig.coefficients[person.environment]) {
            const coeffArray = userConfig.coefficients[person.environment];
            coefMap = {};
            dimNames.forEach((dim, idx) => {
                coefMap[dim] = coeffArray[idx] !== undefined ? coeffArray[idx] : 1.0;
            });
        } else {
            const defaultCoefficients = {
                '职场': [1.0, 1.0, 1.2, 0.8, 1.4, 1.2, 0.8, 1.2, 1.0, 1.4, 1.2, 1.0],
                '项目开发': [1.2, 1.4, 1.6, 1.2, 1.0, 1.0, 1.4, 0.8, 1.2, 1.2, 1.4, 1.6],
                '风险投资': [1.6, 1.8, 1.0, 1.4, 1.2, 1.6, 1.8, 0.6, 1.0, 0.8, 1.4, 1.2],
                '学术研究': [1.4, 0.8, 0.6, 1.6, 1.0, 0.8, 1.2, 1.0, 0.8, 0.6, 1.0, 1.8]
            };
            const defaultArray = defaultCoefficients[person.environment] || dimNames.map(() => 1.0);
            coefMap = {};
            dimNames.forEach((dim, idx) => {
                coefMap[dim] = defaultArray[idx] !== undefined ? defaultArray[idx] : 1.0;
            });
        }

        if (!coefMap) return;

        let totalScore = 0;
        data.scores.forEach((score, idx) => {
            if (idx < dimNames.length) {
                const rawScore = parseInt(score);
                if (!isNaN(rawScore) && rawScore >= 1 && rawScore <= 5) {
                    const dim = dimNames[idx];
                    const coef = coefMap[dim] || 1.0;
                    totalScore += rawScore * coef;
                }
            }
        });

        person.score = Math.round(totalScore * 100) / 100;
        const scoreEl = document.getElementById('currentScore');
        if (scoreEl) scoreEl.textContent = person.score;
    } catch(e) {
        console.log('重新计算分值失败', e);
    }
}

// 设置层级
function setLevel(level) {
    const person = contacts.find(c => c.id === currentPersonId);
    if (!person) return;
    
    person.level = level;
    const levelEl = document.getElementById('currentLevel');
    if (levelEl) levelEl.textContent = level;
    
    document.querySelectorAll('#levelSelect button').forEach(b => b.classList.remove('selected'));
    if (event && event.target) event.target.classList.add('selected');
    
    saveToLocal();
    renderContactList();
}

// 添加联系人
function addContact() {
    const name = prompt('请输入联系人姓名：');
    if (!name) return;
    
    // 查重：检查是否存在同名联系人
    const existingContact = contacts.find(c => c.name === name);
    if (existingContact) {
        const confirmUpdate = confirm(`已存在名为"${name}"的联系人，是否跳转到该联系人？`);
        if (confirmUpdate) {
            selectPerson(existingContact.id);
            return;
        } else {
            return;
        }
    }
    
    const newContact = {
        id: Date.now().toString(),
        name: name,
        level: '',
        environment: '',
        score: 0,
        lastContact: '',
        contactInterval: 7,
        nextContact: '',
        notes: ''
    };
    
    contacts.push(newContact);
    saveToLocal();
    renderAll();
    selectPerson(newContact.id);
}

// 编辑联系人名字
function editPersonName() {
    const person = contacts.find(c => c.id === currentPersonId);
    if (!person) return;
    
    const newName = prompt('请输入新的姓名：', person.name);
    if (!newName) return;
    
    // 查重：检查新名字是否与其他联系人重复
    const existingContact = contacts.find(c => c.name === newName && c.id !== currentPersonId);
    if (existingContact) {
        alert(`已存在名为"${newName}"的联系人，不能使用相同的名字。`);
        return;
    }
    
    person.name = newName;
    const nameEl = document.getElementById('personName');
    if (nameEl) nameEl.textContent = newName;
    saveToLocal();
    renderContactList();
}

// 删除联系人
function deletePerson() {
    if (!confirm('确定要删除该联系人吗？')) return;
    
    contacts = contacts.filter(c => c.id !== currentPersonId);
    currentPersonId = null;
    saveToLocal();
    renderAll();
    
    const personDetail = document.getElementById('personDetail');
    const emptyState = document.getElementById('emptyState');
    if (personDetail) personDetail.classList.remove('active');
    if (emptyState) emptyState.style.display = 'block';
}

// 更改主题色
function changeTheme(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--secondary-color', color + '99');
}

// 模态框操作
function showImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.add('active');
}

function showExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// 导入数据
function importData() {
    const format = document.getElementById('importFormat').value;
    const file = document.getElementById('importFile').files[0];
    
    if (!file) {
        alert('请选择文件');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (format === 'zip') {
                // 新版 ZIP 导入：解析 ZIP 中的每人一个文件
                JSZip.loadAsync(e.target.result).then(async function(zip) {
                    // 1. 导入参数设置
                    const configFile = zip.file('参数设置.json');
                    if (configFile) {
                        const configContent = await configFile.async('string');
                        localStorage.setItem('utopia_config', configContent);
                    }
                    
                    // 2. 导入联系人数据
                    const contactFolder = zip.folder('联系人数据');
                    if (!contactFolder) {
                        // 兼容旧版：尝试直接解析为单个 JSON 文件
                        try {
                            const singleJson = JSON.parse(e.target.result);
                            if (singleJson.contacts && Array.isArray(singleJson.contacts)) {
                                if (singleJson.config) {
                                    localStorage.setItem('utopia_config', JSON.stringify(singleJson.config));
                                }
                                
                                singleJson.contacts.forEach(importedContact => {
                                    const { scoringDetails, ...contactBase } = importedContact;
                                    
                                    // 用 id 去重
                                    const existingIndex = contacts.findIndex(c => c.id === contactBase.id);
                                    
                                    if (existingIndex !== -1) {
                                        // 更新已有联系人
                                        contacts[existingIndex] = contactBase;
                                        
                                        if (scoringDetails) {
                                            localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify(scoringDetails));
                                        }
                                    } else {
                                        // 新增联系人
                                        contacts.push(contactBase);
                                        
                                        if (scoringDetails) {
                                            localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify(scoringDetails));
                                        } else {
                                            localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify({ scores: [], reasons: [] }));
                                        }
                                    }
                                });
                                
                                saveToLocal();
                                renderAll();
                                closeModal('importModal');
                                alert('旧版 ZIP 数据导入成功！');
                                return;
                            }
                        } catch(e2) {
                            alert('无法识别的 ZIP 格式');
                            return;
                        }
                        alert('未找到联系人数据文件夹');
                        return;
                    }
                    
                    const contactFiles = [];
                    contactFolder.forEach((relativePath, file) => {
                        contactFiles.push(file);
                    });
                    
                    for (const file of contactFiles) {
                        const content = await file.async('string');
                        const contactData = JSON.parse(content);
                        
                        // 分离评分数据
                        const { scoringDetails, ...contactBase } = contactData;
                        
                        // 用 id 去重
                        const existingIndex = contacts.findIndex(c => c.id === contactBase.id);
                        
                        if (existingIndex !== -1) {
                            // 更新已有联系人
                            contacts[existingIndex] = contactBase;
                            
                            if (scoringDetails) {
                                localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify(scoringDetails));
                            }
                        } else {
                            // 新增联系人
                            contacts.push(contactBase);
                            
                            if (scoringDetails) {
                                localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify(scoringDetails));
                            } else {
                                localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify({ scores: [], reasons: [] }));
                            }
                        }
                    }
                    
                    saveToLocal();
                    renderAll();
                    closeModal('importModal');
                    alert(`ZIP 数据导入成功！共导入 ${contactFiles.length} 位联系人。`);
                }).catch(function(err) {
                    // JSZip 解析失败，尝试作为纯文本 JSON 导入
                    try {
                        const singleJson = JSON.parse(e.target.result);
                        if (singleJson.contacts && Array.isArray(singleJson.contacts)) {
                            if (singleJson.config) {
                                localStorage.setItem('utopia_config', JSON.stringify(singleJson.config));
                            }
                            
                            singleJson.contacts.forEach(importedContact => {
                                const { scoringDetails, ...contactBase } = importedContact;
                                
                                // 用 id 去重
                                const existingIndex = contacts.findIndex(c => c.id === contactBase.id);
                                
                                if (existingIndex !== -1) {
                                    // 更新已有联系人
                                    contacts[existingIndex] = contactBase;
                                    
                                    if (scoringDetails) {
                                        localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify(scoringDetails));
                                    }
                                } else {
                                    // 新增联系人
                                    contacts.push(contactBase);
                                    
                                    if (scoringDetails) {
                                        localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify(scoringDetails));
                                    } else {
                                        localStorage.setItem(`scoring_${contactBase.id}`, JSON.stringify({ scores: [], reasons: [] }));
                                    }
                                }
                            });
                            
                            saveToLocal();
                            renderAll();
                            closeModal('importModal');
                            alert('ZIP 数据导入成功！');
                            return;
                        }
                    } catch(e2) {
                        alert('导入失败：' + err.message);
                    }
                });
                return;
            }
            
            saveToLocal();
            renderAll();
            closeModal('importModal');
            alert('导入成功！');
        } catch (err) {
            alert('导入失败：' + err.message);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// 导出数据
function exportData() {
    const format = document.getElementById('exportFormat').value;
    
    // 统一使用 ZIP 格式导出
    // 创建 ZIP 压缩包
    const zip = new JSZip();
    
    // 1. 导出参数设置
    const savedConfig = localStorage.getItem('utopia_config');
    if (savedConfig) {
        try {
            const configData = JSON.parse(savedConfig);
            zip.file('参数设置.json', JSON.stringify(configData, null, 2));
        } catch(e) {}
    }
    
    // 2. 为每个联系人单独导出
    contacts.forEach(c => {
        // 联系人基本信息
        const contactData = {
            id: c.id,
            name: c.name,
            level: c.level || '',
            environment: c.environment || '',
            score: c.score || 0,
            lastContact: c.lastContact || '',
            contactInterval: c.contactInterval || 7,
            nextContact: c.nextContact || '',
            notes: c.notes || ''
        };
        
        // 读取该联系人的评分详情
        const savedData = localStorage.getItem(`scoring_${c.id}`);
        if (savedData) {
            try {
                contactData.scoringDetails = JSON.parse(savedData);
            } catch(e) {}
        }
        
        // 写入文件：联系人姓名.json
        const fileName = `${c.name}.json`;
        zip.file(`联系人数据/${fileName}`, JSON.stringify(contactData, null, 2));
    });
    
    // 3. 导出汇总信息
    const summary = {
        exportDate: new Date().toISOString(),
        totalContacts: contacts.length,
        contacts: contacts.map(c => ({
            id: c.id,
            name: c.name,
            level: c.level || '未评级',
            environment: c.environment || '未设置',
            score: c.score || 0
        }))
    };
    zip.file('汇总信息.json', JSON.stringify(summary, null, 2));
    
    // 生成并下载ZIP
    zip.generateAsync({type: 'blob'}).then(function(content) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Utopia_Order_${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }).catch(function(e) {
        alert('导出失败：' + e.message);
    });
    
    closeModal('exportModal');
    setTimeout(() => {
        if (confirm('数据已成功导出！是否清空当前页面数据以重新开始？')) {
            contacts = [];
            currentPersonId = null;
            localStorage.removeItem('contacts');
            renderAll();
            const personDetail = document.getElementById('personDetail');
            const emptyState = document.getElementById('emptyState');
            if (personDetail) personDetail.classList.remove('active');
            if (emptyState) emptyState.style.display = 'block';
            alert('数据已清空，可以开始新的录入！');
        }
    }, 300);
}

// 渲染所有
function renderAll() {
    renderContactList();
    renderReminders();
}