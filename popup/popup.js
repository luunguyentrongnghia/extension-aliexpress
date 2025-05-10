const manifest = chrome.runtime.getManifest();
const apiUrl = manifest.api_url;
document.addEventListener("DOMContentLoaded", async () => {
    const homeTab = document.getElementById("homeTab");
    const settingsTab = document.getElementById("settingsTab");
    const loginTab = document.getElementById("loginTab");
    const homeContent = document.getElementById("homeContent");
    const settingsContent = document.getElementById("settingsContent");
    const loginContent = document.getElementById("loginContent");
    const { refreshToken } = await chrome.storage.local.get('refreshToken');
    if (refreshToken && !isRefreshTokenExpired(refreshToken)) {
        setActiveTab(homeTab, homeContent);
        settingsTab.style.display = "block";
        homeTab.style.display = "block";
        loginTab.style.display = "none"; 
    } else {
        setActiveTab(loginTab, loginContent);
        loginTab.style.display = "block";
        homeTab.style.display = "none"; 
        settingsTab.style.display = "none"; 
    }
    homeTab.addEventListener("click", () => {
        setActiveTab(homeTab, homeContent);
    });

    settingsTab.addEventListener("click", () => {
        setActiveTab(settingsTab, settingsContent);
    });

    loginTab.addEventListener("click", () => {
        setActiveTab(loginTab, loginContent);
    });
    function isRefreshTokenExpired(token) {
        try {
            const decoded = jwt_decode(token); 
            const currentTime = Date.now() / 1000; 
            return decoded.exp < currentTime; 
        } catch (error) {
            console.error("Invalid token", error);
            return true;
        }
    }
});
function setActiveTab(activeTab, activeContent) {
    const allTabs = [homeTab, settingsTab, loginTab];
    const allContents = [homeContent, settingsContent, loginContent];

    allTabs.forEach(tab => tab.classList.remove("active"));
    allContents.forEach(content => content.style.display = "none");
    activeTab.classList.add("active");
    activeContent.style.display = "block"; 
}
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch(`${apiUrl}/api/loginExtention/`, {  
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
        await chrome.storage.local.set({
            accessToken: data.access,
            refreshToken: data.refresh
        });

        document.getElementById('status').innerText = 'Login successful!';
        document.getElementById('loginTab').style.display = 'none'; 
        document.getElementById('homeTab').style.display = 'block';
        document.getElementById('settingsTab').style.display = 'block'; 
        setActiveTab(document.getElementById('homeTab'), document.getElementById('homeContent'));
    } catch (error) {
        document.getElementById('status').innerText = 'Login failed: ' + error.message;

    }
})
document.addEventListener("DOMContentLoaded", async () => {
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', async () => {
        try {
            await chrome.storage.local.remove(['accessToken', 'refreshToken']);
            document.getElementById('loginTab').style.display = 'block';
            document.getElementById('homeTab').style.display = 'none';
            document.getElementById('settingsTab').style.display = 'none';
            setActiveTab(document.getElementById('loginTab'), document.getElementById('loginContent'));
            alert("You have logged out successfully.");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    });
});