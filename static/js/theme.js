// 主题切换功能
const themeSwitch = document.getElementById('themeSwitch');
const htmlElement = document.documentElement;

// 从localStorage加载主题设置
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeSwitch.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeSwitch.textContent = theme === 'light' ? '🌙' : '☀️';
}

// 禁用所有调试相关元素
window.addEventListener('load', () => {
    const debugElements = document.querySelectorAll('[id*="cascade-debug"]');
    debugElements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
    });
});
