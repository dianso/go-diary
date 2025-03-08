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
        startingDay = startingDay === 0 ? 7 : startingDay;
        startingDay--;
        
        const totalDays = lastDay.getDate();
        const weeks = [];
        let week = new Array(7).fill(null);
        let dayCount = 1;

        for (let i = startingDay; i < 7 && dayCount <= totalDays; i++) {
            week[i] = dayCount++;
        }
        weeks.push(week);

        while (dayCount <= totalDays) {
            week = new Array(7).fill(null);
            for (let i = 0; i < 7 && dayCount <= totalDays; i++) {
                week[i] = dayCount++;
            }
            weeks.push(week);
        }

        return weeks;
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

    createCalendarDay(date) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('col', 'calendar-day');

        if (date) {
            const dateStr = this.formatDate(date);
            const isToday = this.isToday(date);
            const hasDiary = this.diaryDates.has(dateStr);

            dayDiv.innerHTML = `
                <div class="day-number">${date.getDate()}</div>
                ${this.getDayLabel(date) ? `<div class="day-label">${this.getDayLabel(date)}</div>` : ''}
            `;

            if (isToday) {
                dayDiv.classList.add('today');
            }

            if (hasDiary) {
                dayDiv.classList.add('has-diary');
            } else {
                dayDiv.classList.add('no-diary');
            }

            dayDiv.addEventListener('click', () => {
                window.location.href = `/diary/${dateStr}`;
            });
        } else {
            dayDiv.classList.add('empty');
        }

        return dayDiv;
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        
        // 更新月份标题
        this.currentMonthElement.textContent = `${year}年${month + 1}月`;

        const weeks = this.getMonthCalendar(year, month);
        let calendarHtml = '';

        weeks.forEach(week => {
            const row = document.createElement('div');
            row.classList.add('row', 'g-0');
            week.forEach(day => {
                const date = day ? new Date(year, month, day) : null;
                row.appendChild(this.createCalendarDay(date));
            });
            document.getElementById('calendarGrid').appendChild(row);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new DiaryCalendar();
});
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new DiaryCalendar();
});
