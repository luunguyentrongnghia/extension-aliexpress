

const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline'],
            ['link'],
            [{ 'align': [] }],
            ['clean']                                         
        ]
    }
});
// Hàm này để thêm sự kiện click cho tất cả các tab
const tabMenuIds = ["import-list", "my-products", "my-orders", "apps", "help-center"];
tabMenuIds.forEach(tabId => {
    document.getElementById(`${tabId}-tab`).addEventListener("click", () => showTabMenu(tabId));
});
const tabProductIds = ["product", "description", "variants", "images"]; // Dùng tên tab thay vì id tab
tabProductIds.forEach(tabName => {
    // Thêm sự kiện click cho mỗi tab
    document.getElementById(`${tabName}-tab`).addEventListener("click", () => showTabProduct(tabName));
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
function showTabProduct(tabName) {
    const tabs = document.querySelectorAll('.tab'); // Lấy tất cả các tab
    const contents = document.querySelectorAll('.tab-content'); // Lấy tất cả các nội dung tab

    // Ẩn tất cả các tab và nội dung
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    // Hiển thị nội dung của tab và đánh dấu tab là active
    document.querySelector(`#${tabName}`).classList.add('active');
    document.querySelector(`#${tabName}-tab`).classList.add('active');
}


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