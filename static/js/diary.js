// 自动保存功能
const textarea = document.getElementById('content');
let content = textarea.value;
let lastSaveTime = Date.now();
let saveTimeout = null;

function saveContent() {
    const currentContent = textarea.value;
    if (currentContent !== content) {
        const formData = new FormData();
        formData.append('content', currentContent);

        fetch(window.location.href, {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                content = currentContent;
                lastSaveTime = Date.now();
                console.log('内容已自动保存');
            }
        }).catch(error => {
            console.error('保存失败:', error);
        });
    }
}

function checkAndSave() {
    const now = Date.now();
    if (now - lastSaveTime >= 1000) {  // 至少间隔1秒才保存
        saveContent();
    }
}

textarea.addEventListener('input', () => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(checkAndSave, 1000);
});

// 文本框自动调整高度功能
function adjustHeight() {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

textarea.addEventListener('input', adjustHeight);
window.addEventListener('resize', adjustHeight);

// 页面加载完成后自动调整高度
adjustHeight();

// 日期导航功能
const currentDate = new Date(document.querySelector('.diary-header h1').textContent.split(' ')[0]);

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 设置导航链接
const yesterday = new Date(currentDate);
yesterday.setDate(yesterday.getDate() - 1);
document.getElementById('yesterdayLink').href = `/diary/${formatDate(yesterday)}`;

const today = new Date();
today.setHours(0, 0, 0, 0);
document.getElementById('todayLink').href = `/diary/${formatDate(today)}`;

const tomorrow = new Date(currentDate);
tomorrow.setDate(tomorrow.getDate() + 1);
document.getElementById('tomorrowLink').href = `/diary/${formatDate(tomorrow)}`;

// 设置相对日期显示
const dateRelative = document.getElementById('dateRelative');
const todayStr = formatDate(today);
const currentStr = formatDate(currentDate);

if (currentStr === todayStr) {
    dateRelative.textContent = '今天';
} else {
    const diffTime = currentDate - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === -1) {
        dateRelative.textContent = '昨天';
    } else if (diffDays === 1) {
        dateRelative.textContent = '明天';
    } else if (diffDays < 0) {
        dateRelative.textContent = `${Math.abs(diffDays)}天前`;
    } else {
        dateRelative.textContent = `${diffDays}天后`;
    }
}
