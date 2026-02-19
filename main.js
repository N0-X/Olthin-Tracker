import OBR from "https://unpkg.com/@owlbear-rodeo/sdk/dist/index.mjs";

let combatState = {
    round: 1,
    turnIndex: 0,
    order: []
};

const METADATA_KEY = "actionInitiativeTracker";

OBR.onReady(async () => {
    const metadata = await OBR.room.getMetadata();
    if (metadata[METADATA_KEY]) {
        combatState = metadata[METADATA_KEY];
    }
    render();
});

async function saveState() {
    await OBR.room.setMetadata({
        [METADATA_KEY]: combatState
    });
}

function render() {
    document.getElementById("round").textContent = combatState.round;
    const list = document.getElementById("list");
    list.innerHTML = "";

    combatState.order.forEach((c, index) => {
        const div = document.createElement("div");
        div.className = "combatant";
        if (index === combatState.turnIndex) {
        div.classList.add("active");
        }

        div.innerHTML = `
        <img src="${c.image}" />
        <strong>${c.name}</strong>
        INI: ${c.initiative}
        AP: ${c.actionPoints}
        <button onclick="changeAP(${index}, -1)">-</button>
        <button onclick="changeAP(${index}, 1)">+</button>
        <button onclick="resetAP(${index})">Reset</button>
        `;

        list.appendChild(div);
    });
}

window.addSelected = async function () {
    const selection = await OBR.player.getSelection();
    if (selection.length === 0) return;

    const items = await OBR.scene.items.getItems(selection);
    const token = items[0];

    const initiative = parseInt(prompt("Valor de iniciativa:"));
    const actionPoints = parseInt(prompt("Pontos de ação iniciais:"));

    combatState.order.push({
        id: token.id,
        name: token.name || "Sem Nome",
        image: token.image?.url || "",
        initiative: initiative || 0,
        actionPoints: actionPoints || 0,
        maxAP: actionPoints || 0
    });

    combatState.order.sort((a, b) => b.initiative - a.initiative);

    await saveState();
    render();
};

window.nextTurn = async function () {
    combatState.turnIndex++;

    if (combatState.turnIndex >= combatState.order.length) {
        combatState.turnIndex = 0;
        combatState.round++;
    }

    await saveState();
    render();
};

window.changeAP = async function (index, amount) {
    combatState.order[index].actionPoints += amount;
    if (combatState.order[index].actionPoints < 0)
        combatState.order[index].actionPoints = 0;

    await saveState();
    render();
};

window.resetAP = async function (index) {
    combatState.order[index].actionPoints =
        combatState.order[index].maxAP;

    await saveState();
    render();
};
