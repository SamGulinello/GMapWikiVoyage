import Mellowtel from "mellowtel";
const mellowtel = new Mellowtel("74e89418");

async function openSettings() {
    try {
        // Generate and manage the settings link
        const settingsLink = await mellowtel.generateSettingsLink();
        // Log the generated link for debugging
        console.log("Generated Settings Link:", settingsLink);
        // redirect to settingsLink
        window
            .open(settingsLink, "_blank")
            .focus
    } catch (error) {
        console.error("Error generating settings link:", error);
    }
}

document.getElementById("openSettings").addEventListener("click", () => {
    openSettings();
});