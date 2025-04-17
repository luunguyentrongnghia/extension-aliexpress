document.addEventListener("DOMContentLoaded", () => {
    // Lấy các phần tử tab và nội dung
    const homeTab = document.getElementById("homeTab");
    const settingsTab = document.getElementById("settingsTab");
    const loginTab = document.getElementById("loginTab");

    const homeContent = document.getElementById("homeContent");
    const settingsContent = document.getElementById("settingsContent");
    const loginContent = document.getElementById("loginContent");

    // Khi click vào các tab, hiển thị nội dung của tab đó
    homeTab.addEventListener("click", () => {
        setActiveTab(homeTab, homeContent);
    });

    settingsTab.addEventListener("click", () => {
        setActiveTab(settingsTab, settingsContent);
    });

    loginTab.addEventListener("click", () => {
        setActiveTab(loginTab, loginContent);
    });

    // Hàm để chuyển tab
    function setActiveTab(activeTab, activeContent) {
        const allTabs = [homeTab, settingsTab, loginTab];
        const allContents = [homeContent, settingsContent, loginContent];

        // Xóa lớp "active" khỏi tất cả các tab và nội dung
        allTabs.forEach(tab => tab.classList.remove("active"));
        allContents.forEach(content => content.style.display = "none");

        // Thêm lớp "active" cho tab và nội dung được chọn
        activeTab.classList.add("active");
        activeContent.style.display = "block"; // Hiển thị nội dung tương ứng với tab
    }

    // Mặc định mở tab Home khi popup load
    setActiveTab(loginTab, loginContent);
});
document.addEventListener("DOMContentLoaded", () => {
    const importButton = document.querySelector('.import-button');

    // Khi người dùng nhấn vào nút "Import Product to Spocket"
    importButton.addEventListener('click', () => {
        // Mở trang options.html trong một tab mới
        chrome.tabs.create({ url: chrome.runtime.getURL('page/product-management.html') });
    });
});
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch('http://127.0.0.1:8000/api/loginExtention/', {  // URL API Django
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'email-username': username,
                'password': password
            })
        });
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        console.log(data);
        // Lưu token vào chrome.storage
        await chrome.storage.local.set({
            accessToken: data.access,
            refreshToken: data.refresh
        });

        document.getElementById('status').innerText = 'Login successful!';
    } catch (error) {
        document.getElementById('status').innerText = 'Login failed: ' + error.message;

    }
})

async function refreshAccessToken() {
    const { refreshToken } = await chrome.storage.local.get('refreshToken');
    
    const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    // Lưu access và refresh token mới vào chrome.storage
    await chrome.storage.local.set({
        accessToken: data.access,
        refreshToken: data.refresh
    });

    return data.access;  // Trả về access token mới
}