// 主题管理类
class ThemeManager {
    constructor() {
        this.themeSwitch = document.getElementById('themeSwitch');
        this.htmlElement = document.documentElement;
        this.init();
    }

    init() {
        if (!this.themeSwitch) return;

        // 从localStorage加载主题设置
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        this.themeSwitch.addEventListener('click', () => {
            const currentTheme = this.htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        });
    }

    setTheme(theme) {
        this.htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateThemeIcon(theme);
    }

    updateThemeIcon(theme) {
        this.themeSwitch.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// 日历管理类
class DiaryCalendar {
    constructor() {
        // 如果不是日历页面，则不初始化
        if (!document.getElementById('calendarGrid')) return;

        this.currentDate = new Date();
        this.diaryDates = new Set();
        this.yearSelect = document.getElementById('yearSelect');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.todayBtn = document.getElementById('todayBtn');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.calendarGrid = document.getElementById('calendarGrid');
        this.totalDiaryCount = document.getElementById('totalDiaryCount');
        this.pageTitle = document.getElementById('pageTitle');
        this.init();
    }

    async init() {
        // 初始化年份选择器
        await this.loadAvailableYears();
        
        // 加载日记数据
        await this.loadDiaryDates();
        
        // 渲染日历
        this.renderCalendar();
        
        // 绑定事件
        this.bindEvents();
    }

    async loadAvailableYears() {
        try {
            const response = await fetch('/years');
            if (!response.ok) {
                throw new Error('获取年份列表失败');
            }
            const years = await response.json();
            
            // 如果没有可用年份，添加当前年份
            if (years.length === 0) {
                years.push(this.currentDate.getFullYear().toString());
            }

            // 清空并重新填充年份选择器
            this.yearSelect.innerHTML = '';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year + '年';
                if (year === this.currentDate.getFullYear().toString()) {
                    option.selected = true;
                }
                this.yearSelect.appendChild(option);
            });
        } catch (error) {
            console.error('加载年份失败:', error);
            // 如果加载失败，至少显示当前年份
            this.yearSelect.innerHTML = `<option value="${this.currentDate.getFullYear()}">${this.currentDate.getFullYear()}年</option>`;
        }
    }

    async loadDiaryDates() {
        try {
            const response = await fetch('/api/diary-dates');
            if (!response.ok) {
                throw new Error('加载日记日期失败');
            }
            const dates = await response.json();
            if (!Array.isArray(dates)) {
                throw new Error('日记日期数据格式错误');
            }
            this.diaryDates = new Set(dates);
            this.updateTotalDiaryCount();
        } catch (error) {
            console.error('加载日记日期出错:', error);
            this.diaryDates = new Set();
            this.updateTotalDiaryCount();
        }
    }

    updateTotalDiaryCount() {
        const totalDiaryCount = document.getElementById('totalDiaryCount');
        if (totalDiaryCount) {
            totalDiaryCount.textContent = `日记数量：${this.diaryDates.size}篇`;
        }
    }

    bindEvents() {
        this.prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
        this.todayBtn.addEventListener('click', () => this.goToToday());
        this.yearSelect.addEventListener('change', () => this.changeYear());
    }

    navigateMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.yearSelect.value = this.currentDate.getFullYear();
        this.renderCalendar();
    }

    changeYear() {
        const selectedYear = parseInt(this.yearSelect.value);
        this.currentDate.setFullYear(selectedYear);
        this.renderCalendar();
    }

    renderCalendar() {
        this.calendarGrid.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 计算第一天是星期几（0是星期日，1是星期一，以此类推）
        let firstDayOfWeek = firstDay.getDay();
        // 转换为周一为第一天的格式（0是星期一，6是星期日）
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        
        // 添加空白格子来对齐第一天
        for (let i = 0; i < firstDayOfWeek; i++) {
            this.calendarGrid.appendChild(this.createCalendarDay(null));
        }
        
        // 填充日期
        for (let day = 1; day <= lastDay.getDate(); day++) {
            this.calendarGrid.appendChild(this.createCalendarDay(day));
        }

        // 如果需要，添加末尾的空白格子
        const totalDays = firstDayOfWeek + lastDay.getDate();
        const remainingCells = 7 - (totalDays % 7);
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                this.calendarGrid.appendChild(this.createCalendarDay(null));
            }
        }

        this.updateTitle();
    }

    updateTitle() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        const title = `${year}年${month}月`;
        
        if (this.currentMonthElement) {
            this.currentMonthElement.textContent = `${year}年${month}月`;
        }
        
        if (this.pageTitle) {
            this.pageTitle.textContent = title;
        }
    }

    createCalendarDay(day) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('diary-calendar-day');
        
        if (day === null) {
            dayElement.classList.add('empty');
            return dayElement;
        }

        const dayNumber = document.createElement('div');
        dayNumber.classList.add('diary-day-number');
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        const currentDate = new Date();
        const calendarDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        const formattedDate = this.formatDate(calendarDate);

        // 检查是否为今天
        if (this.isToday(calendarDate)) {
            dayElement.classList.add('today');
        }

        // 检查是否有日记
        if (this.diaryDates.has(formattedDate)) {
            dayElement.classList.add('has-diary');
        } else {
            dayElement.classList.add('no-diary');
        }

        // 添加日期标签（今天、明天、昨天）
        const label = document.createElement('div');
        const dayLabel = this.getDayLabel(calendarDate);
        if (dayLabel) {
            label.classList.add('diary-day-label');
            label.textContent = dayLabel;
            dayElement.appendChild(label);
        }

        dayElement.addEventListener('click', () => {
            window.location.href = `/diary/${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        });

        return dayElement;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    isToday(date) {
        const today = new Date();
        return date.getFullYear() === today.getFullYear() &&
               date.getMonth() === today.getMonth() &&
               date.getDate() === today.getDate();
    }

    getDayLabel(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24));
        
        switch (diffDays) {
            case -1:
                return '昨天';
            case 0:
                return '今天';
            case 1:
                return '明天';
            default:
                return '';
        }
    }
}

// 日记编辑器类
class DiaryEditor {
    constructor() {
        // 如果不是日记页面，则不初始化
        if (!document.getElementById('content')) return;

        this.textarea = document.getElementById('content');
        this.saveStatus = document.getElementById('saveStatus');
        this.lastSaveTime = 0;
        this.originalContent = this.textarea.value;
        // 从URL中获取日期
        this.currentDate = window.location.pathname.split('/').pop();

        this.init();
    }

    init() {
        this.bindEvents();
        this.restoreFromLocalStorage();
        this.adjustHeight();
    }

    bindEvents() {
        // 自动保存
        this.textarea.addEventListener('input', () => {
            this.debouncedSave();
        });

        // 自动调整高度
        this.textarea.addEventListener('input', () => this.adjustHeight());
        window.addEventListener('resize', () => this.adjustHeight());

        // 页面关闭前保存
        window.addEventListener('beforeunload', () => {
            if (this.textarea.value !== this.originalContent) {
                this.saveToLocalStorage(this.textarea.value);
            }
        });
    }

    debouncedSave = debounce(() => {
        const now = Date.now();
        if (now - this.lastSaveTime >= 1000) {
            this.saveContent();
        }
    }, 1000);

    async saveContent(retryAttempt = 0) {
        const content = this.textarea.value;
        if (content === this.originalContent) {
            return;
        }

        try {
            const response = await fetch(window.location.pathname, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `content=${encodeURIComponent(content)}`,
            });

            if (response.ok) {
                this.updateSaveStatus('success', '已保存');
                this.originalContent = content;
                this.lastSaveTime = Date.now();
                this.saveToLocalStorage(content);
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存失败:', error);
            this.updateSaveStatus('error', '保存失败');
            this.saveToLocalStorage(content);

            // 如果是网络错误，尝试重试
            if (retryAttempt < 3) {
                setTimeout(() => {
                    this.saveContent(retryAttempt + 1);
                }, 1000 * (retryAttempt + 1));
            }
        }
    }

    updateSaveStatus(status, message) {
        this.saveStatus.textContent = message;
        this.saveStatus.style.opacity = '1';
        setTimeout(() => {
            this.saveStatus.style.opacity = '0';
        }, 2000);
    }

    saveToLocalStorage(content) {
        if (this.currentDate) {
            localStorage.setItem(`diary_${this.currentDate}`, content);
        }
    }

    restoreFromLocalStorage() {
        if (this.currentDate) {
            const savedContent = localStorage.getItem(`diary_${this.currentDate}`);
            if (savedContent && this.textarea.value === '') {
                this.textarea.value = savedContent;
            }
        }
    }

    adjustHeight() {
        this.textarea.style.height = 'auto';
        this.textarea.style.height = this.textarea.scrollHeight + 'px';
    }
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化主题管理器
    new ThemeManager();
    
    // 初始化日历（如果在日历页面）
    new DiaryCalendar();

    // 初始化日记编辑器（如果在日记页面）
    new DiaryEditor();
    
    // 禁用调试相关元素
    const debugElements = document.querySelectorAll('[id*="cascade-debug"]');
    debugElements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
    });
});
