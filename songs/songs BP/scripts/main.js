import { world, system } from "@minecraft/server";
import { ModalFormData, ActionFormData } from "@minecraft/server-ui";

const SONG_LIST = [
    { label: "Bad Shawty", id: "custom_sound.bad_shawty" },
    { label: "คู่ครอง", id: "custom_sound.kukrong" },
    { label: "ย้อนบุญผลา", id: "custom_sound.boonpala" },
    { label: "บอกรัก", id: "custom_sound.saylove" },
    { label: "คนอีสานบ่", id: "custom_sound.esan" },
    { label: "ซงโตรย", id: "custom_sound.chongtroy" }
];

world.afterEvents.itemUse.subscribe((event) => {
    const { source: player, itemStack } = event;
    if (itemStack.typeId === "custom:sound_player") {
        system.run(() => showMainGui(player));
    }
});

function showMainGui(player) {
    new ActionFormData()
        .title("§lระบบเครื่องเล่นเสียง")
        .button("§l▶ เลือกและเล่นเพลง")
        .button("§l§e🔇 ปิดเสียงเฉพาะฉัน (Mute)") // ปุ่มมิ้วแยกออกมา
        .button("§l§c■ หยุดเพลงทั้งหมด (Stop All)") // ปุ่มหยุดสำหรับทุกคน
        .show(player).then((res) => {
            if (res.canceled) return;
            
            if (res.selection === 0) {
                showPlaySettings(player);
            } 
            else if (res.selection === 1) {
                // --- ระบบ Mute (ปิดเฉพาะคนที่กด) ---
                player.runCommandAsync("stopsound @s");
                player.onScreenDisplay.setActionBar("§e🔇 ปิดเสียงสำหรับคุณแล้ว");
            } 
            else if (res.selection === 2) {
                // --- ระบบ Stop (หยุดทุกคน) ---
                player.runCommandAsync("stopsound @a");
                player.onScreenDisplay.setActionBar("§c■ หยุดเพลงสำหรับทุกคนแล้ว");
            }
        });
}

function showPlaySettings(player) {
    const oldRadius = player.getDynamicProperty("sound_radius")?.toString() ?? "16";

    new ModalFormData()
        .title("ตั้งค่าเพลง")
        .textField("ระยะที่ให้ได้ยิน (บล็อก):", "เช่น 16, 64, 100", oldRadius)
        .slider("ระดับความดัง (%)", 0, 100, 10, 100)
        .dropdown("เลือกเพลง:", SONG_LIST.map(s => s.label), 0)
        .show(player).then((res) => {
            if (res.canceled) return;
            const [radiusStr, volPercent, songIdx] = res.formValues;

            const radius = parseFloat(radiusStr) || 16;
            const userVol = volPercent / 100;
            const song = SONG_LIST[songIdx];

            player.setDynamicProperty("sound_radius", radius);

            // คำนวณความดัง (สูตรขยายระยะทาง Minecraft)
            const finalVolume = (radius / 16) * userVol;

            // สั่งเล่นเพลงให้ทุกคนในเซิร์ฟเวอร์ (@a)
            player.runCommandAsync(`playsound ${song.id} @a ~ ~ ~ ${finalVolume.toFixed(2)} 1.0`);

            player.onScreenDisplay.setActionBar(`§aกำลังเล่น: ${song.label}\n§7ระยะ: ${radius} บล็อก`);
        });
}