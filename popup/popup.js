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
