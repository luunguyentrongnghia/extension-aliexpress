let htmlTemplate = `<div class="import-button-container">
    <button class="import-button">Import to Spocket</button>
</div>`;
let link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL('css/content.css');
document.head.appendChild(link);
window.onload = () => {
    const wrapperObject = document.querySelector(".index-page");
    console.log(wrapperObject);
    
    if (wrapperObject !== null) {
        // Sử dụng insertAdjacentHTML để thêm HTML vào cuối phần tử một cách an toàn
        wrapperObject.insertAdjacentHTML('beforeend', htmlTemplate);
        
        // Lắng nghe sự kiện click để thực hiện logic lấy dữ liệu sản phẩm
        const importButton = wrapperObject.querySelector(".import-button");
        importButton.addEventListener("click", () => {
            console.log("Fetching product data...");
            // Logic lấy dữ liệu sản phẩm từ trang
        });
    }
};


