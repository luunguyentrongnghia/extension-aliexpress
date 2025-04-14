document.addEventListener("DOMContentLoaded", () => {
    // Lấy các phần tử tab và nội dung
    const homeTab = document.getElementById("homeTab");
    const settingsTab = document.getElementById("settingsTab");
    const helpTab = document.getElementById("helpTab");

    const homeContent = document.getElementById("homeContent");
    const settingsContent = document.getElementById("settingsContent");
    const helpContent = document.getElementById("helpContent");

    // Khi click vào các tab, hiển thị nội dung của tab đó
    homeTab.addEventListener("click", () => {
        setActiveTab(homeTab, homeContent);
    });

    settingsTab.addEventListener("click", () => {
        setActiveTab(settingsTab, settingsContent);
    });

    helpTab.addEventListener("click", () => {
        setActiveTab(helpTab, helpContent);
    });

    // Hàm để chuyển tab
    function setActiveTab(activeTab, activeContent) {
        const allTabs = [homeTab, settingsTab, helpTab];
        const allContents = [homeContent, settingsContent, helpContent];

        // Xóa lớp "active" khỏi tất cả các tab và nội dung
        allTabs.forEach(tab => tab.classList.remove("active"));
        allContents.forEach(content => content.style.display = "none");

        // Thêm lớp "active" cho tab và nội dung được chọn
        activeTab.classList.add("active");
        activeContent.style.display = "block"; // Hiển thị nội dung tương ứng với tab
    }

    // Mặc định mở tab Home khi popup load
    setActiveTab(homeTab, homeContent);
});
