document.addEventListener("DOMContentLoaded", async () => {
    // Lấy các phần tử tab và nội dung
    const homeTab = document.getElementById("homeTab");
    const settingsTab = document.getElementById("settingsTab");
    const loginTab = document.getElementById("loginTab");

    const homeContent = document.getElementById("homeContent");
    const settingsContent = document.getElementById("settingsContent");
    const loginContent = document.getElementById("loginContent");

    // Kiểm tra refreshToken khi extension load
    const { refreshToken } = await chrome.storage.local.get('refreshToken');
    console.log('Refresh Token:', refreshToken);
    if (refreshToken && !isRefreshTokenExpired(refreshToken)) {
        // Nếu refreshToken còn hạn, hiển thị tab Home và Settings
        setActiveTab(homeTab, homeContent);
        settingsTab.style.display = "block";
        homeTab.style.display = "block";
        loginTab.style.display = "none"; // Ẩn tab Login
    } else {
        // Nếu không có refreshToken hoặc refreshToken hết hạn, hiển thị tab Login
        setActiveTab(loginTab, loginContent);
        loginTab.style.display = "block";
        homeTab.style.display = "none"; // Ẩn tab Home
        settingsTab.style.display = "none"; // Ẩn tab Settings
    }

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

    // Hàm để kiểm tra nếu refreshToken hết hạn
    function isRefreshTokenExpired(token) {
        try {
            const decoded = jwt_decode(token); // Giải mã JWT để kiểm tra thời gian hết hạn
            const currentTime = Date.now() / 1000; // Thời gian hiện tại (epoch)
            return decoded.exp < currentTime; // Kiểm tra nếu token đã hết hạn
        } catch (error) {
            console.error("Invalid token", error);
            return true; // Nếu token không hợp lệ, coi như đã hết hạn
        }
    }

    // Hàm để chuyển tab
});
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
        console.log(response);
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
        document.getElementById('loginTab').style.display = 'none'; // Ẩn tab login
        document.getElementById('homeTab').style.display = 'block'; // Hiển thị tab Home
        document.getElementById('settingsTab').style.display = 'block'; // Hiển thị tab Settings

        // Mở tab Home hoặc Settings (ở đây chọn Home là tab mặc định)
        setActiveTab(document.getElementById('homeTab'), document.getElementById('homeContent'));
    } catch (error) {
        document.getElementById('status').innerText = 'Login failed: ' + error.message;

    }
})
document.addEventListener("DOMContentLoaded", async () => {
    // Lấy phần tử nút logout
    const logoutButton = document.getElementById('logoutButton');

    // Xử lý sự kiện logout khi nhấn vào nút
    logoutButton.addEventListener('click', async () => {
        try {
            // Xoá accessToken và refreshToken khỏi storage
            await chrome.storage.local.remove(['accessToken', 'refreshToken']);
            
            // Chuyển hướng về tab login
            document.getElementById('loginTab').style.display = 'block'; // Hiển thị tab login
            document.getElementById('homeTab').style.display = 'none'; // Ẩn tab Home
            document.getElementById('settingsTab').style.display = 'none'; // Ẩn tab Settings
            setActiveTab(document.getElementById('loginTab'), document.getElementById('loginContent'));

            // Thông báo thành công
            alert("You have logged out successfully.");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    });
});
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