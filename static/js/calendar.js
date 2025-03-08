class DiaryCalendar {
    constructor() {
        this.currentDate = new Date();
        this.diaryDates = new Set();
        this.init();
    }

    init() {
        this.yearSelect = document.getElementById('yearSelect');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.totalDiaryCountElement = document.getElementById('totalDiaryCount');
        this.attachEventListeners();
        this.getDiaryDates();
    }

    attachEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());
        this.yearSelect.addEventListener('change', () => this.changeYear());
    }

    async getDiaryDates() {
        try {
            const response = await fetch('/api/diary-dates');
            const dates = await response.json();
            this.diaryDates = new Set(dates);
            this.initYearSelect();
            this.updateTotalDiaryCount();
            this.renderCalendar();
        } catch (error) {
            console.error('获取日记日期失败:', error);
            this.renderCalendar();
        }
    }

    updateTotalDiaryCount() {
        const totalCount = this.diaryDates.size;
        this.totalDiaryCountElement.textContent = `日记数量：${totalCount}篇`;
    }

    initYearSelect() {
        this.yearSelect.innerHTML = '';
        const currentYear = new Date().getFullYear();
        const years = new Set();

        years.add(currentYear);

        this.diaryDates.forEach(date => {
            const year = parseInt(date.split('-')[0]);
            years.add(year);
        });

        const sortedYears = Array.from(years).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}年`;
            if (year === this.currentDate.getFullYear()) {
                option.selected = true;
            }
            this.yearSelect.appendChild(option);
        });
    }

    changeYear() {
        const selectedYear = parseInt(this.yearSelect.value);
        this.currentDate.setFullYear(selectedYear);
        this.renderCalendar();
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.yearSelect.value = this.currentDate.getFullYear();
        this.renderCalendar();
    }

    getMonthCalendar(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let startingDay = firstDay.getDay();
        if (startingDay === 0) startingDay = 7;
        startingDay--;
        
        const totalDays = lastDay.getDate();
        const days = [];
        
        // 填充前面的空白日期
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        
        // 填充实际日期
        for (let i = 1; i <= totalDays; i++) {
            days.push(i);
        }
        
        // 填充后面的空白日期
        while (days.length % 7 !== 0) {
            days.push(null);
        }
        
        return days;
    }

    getDayLabel(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        
        if (compareDate.getTime() === today.getTime()) {
            return '今天';
        } else if (compareDate.getTime() === yesterday.getTime()) {
            return '昨天';
        } else if (compareDate.getTime() === tomorrow.getTime()) {
            return '明天';
        }
        return '';
    }

    createCalendarDay(day) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('col');
        
        if (!day) {
            dayDiv.innerHTML = '<div class="calendar-day empty"></div>';
            return dayDiv;
        }

        const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        const dateStr = this.formatDate(date);
        const isToday = this.isToday(date);
        const hasDiary = this.diaryDates.has(dateStr);
        const dayLabel = this.getDayLabel(date);

        const dayContent = document.createElement('div');
        dayContent.classList.add('calendar-day');
        
        if (isToday) {
            dayContent.classList.add('today');
        }
        
        if (hasDiary) {
            dayContent.classList.add('has-diary');
        }

        dayContent.innerHTML = `
            <div class="day-number">${day}</div>
            ${dayLabel ? `<div class="relative-date">${dayLabel}</div>` : ''}
        `;

        dayContent.addEventListener('click', () => {
            window.location.href = `/diary/${dateStr}`;
        });

        dayDiv.appendChild(dayContent);
        return dayDiv;
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 更新月份标题
        this.currentMonthElement.textContent = `${year}年${month + 1}月`;

        // 清空现有日历内容
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        // 获取月份的所有日期
        const days = this.getMonthCalendar(year, month);
        
        // 创建日期元素
        days.forEach(day => {
            calendarGrid.appendChild(this.createCalendarDay(day));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new DiaryCalendar();
});
