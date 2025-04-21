

// Hàm này để thêm sự kiện click cho tất cả các tab
 tabMenuIds = ["import-list", "my-products", "my-orders", "apps", "help-center"];
tabMenuIds.forEach(tabId => {
    document.getElementById(`${tabId}-tab`).addEventListener("click", () => showTabMenu(tabId));
});
function showTabMenu(tabId) {
    // Ẩn tất cả các phần nội dung
    const sections = document.querySelectorAll(".content-section");
    sections.forEach(section => section.classList.remove("active"));

    // Hiển thị phần nội dung của tab được chọn
    document.getElementById(tabId).classList.add("active");

    // Cập nhật trạng thái cho các tab trong sidebar
    updateActiveLink(tabId);
}

function updateActiveLink(tabId) {
    const links = document.querySelectorAll(".nav-link");
    links.forEach(link => link.classList.remove("active"));
    document.getElementById(`${tabId}-tab`).classList.add("active");
}

// Hàm này sẽ dùng cho các tab nội dung (Product, Description, Variants, Images)


const imageCheckboxes = document.querySelectorAll('.image-checkbox');

// Xử lý khi có thay đổi trong trạng thái checkbox
imageCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            console.log(`Image ${e.target.id} was selected`);
        } else {
            console.log(`Image ${e.target.id} was deselected`);
        }
    });
});