let players = [];
let s = [];
let n = 0;
let finalResults = [];
let num_click = 0;

function Addplayer() {
    finalResults = []
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = ""

    const nameInput = document.getElementById("inputName");
    const name = nameInput.value.trim();

    if (!name) {
        alert("Please enter a valid name.");
        return;
    }
    if (players.includes(name)) {
        alert('This name is already taken.');
    } else {
        players.push(name);
        nameInput.value = '';
        updatePlayerList();
    }
}

function removePlayer(playerName) {
    document.getElementById("RoleSelection").classList.add("hidden")
    document.getElementById("result").classList.add("hidden")
    finalResults = []
    players = players.filter(player => player !== playerName);
    updatePlayerList();
    if (players.length < 6) {
        document.getElementById("RoleSelection").classList.add("hidden");
    }
}

function updatePlayerList() {
    const playerRemoveDiv = document.getElementById("playerRemoveDiv");
    const playerList = document.getElementById("playerList");
    playerList.innerHTML = `<strong>Players (${players.length}):</strong>`;
    playerRemoveDiv.innerHTML = '';

    players.forEach(player => {
        const playerDiv = document.createElement("div");
        playerDiv.classList.add("playerDiv");

        const playerName = document.createElement("p");
        playerName.textContent = player;
        playerDiv.ondblclick = () => removePlayer(player);

        const removeButton = document.createElement("button");
        removeButton.textContent = "";
        removeButton.ondblclick = () => removePlayer(player);
        removeButton.classList.add("button2");

        playerDiv.appendChild(playerName);
        playerDiv.appendChild(removeButton);

        playerRemoveDiv.appendChild(playerDiv);
    });
}

function assignCustomRoles() {
    document.getElementById("playerRemoveDiv").classList.add("hidden")
    document.getElementById("result").classList.add("hidden")
    const roleCounts = {
        "Witch": parseInt(document.getElementById("witch").value) || 0,
        "Hunter": parseInt(document.getElementById("hunter").value) || 0,
        "Mayor": parseInt(document.getElementById("mayor").value) || 0,
        "Love King": parseInt(document.getElementById("loveKing").value) || 0,
        "Werewolf": parseInt(document.getElementById("werewolf").value) || 0,
        "Seer": parseInt(document.getElementById("Seer").value) || 0,
        "White Wolf": parseInt(document.getElementById("whitewolf").value) || 0,
        "Blue Wolf": parseInt(document.getElementById("bluewolf").value) || 0,
        "Barbi": parseInt(document.getElementById("barbi").value) || 0,
        "Healer": parseInt(document.getElementById("healer").value) || 0,
        "Infected Wolf": parseInt(document.getElementById("InfectedWolf").value) || 0,
        "Red Wolf": parseInt(document.getElementById("RedWolf").value) || 0,
        "Fog Wolf": parseInt(document.getElementById("FogWolf").value) || 0,
        "Bear": parseInt(document.getElementById("Bear").value) || 0,
        "Master Bear": parseInt(document.getElementById("MasterBear").value) || 0,
        "Wild children": parseInt(document.getElementById("Wildchildren").value) || 0,
        "kamikaze": parseInt(document.getElementById("kamikaze").value) || 0,
        "Talkative wolf": parseInt(document.getElementById("Talkativewolf").value) || 0,
        "judge": parseInt(document.getElementById("judge").value) || 0,
        "Thief": parseInt(document.getElementById("Thief").value) || 0,
        "Alien": parseInt(document.getElementById("alien").value) || 0
    };

    let roles = [];
    for (const [role, RoleN] of Object.entries(roleCounts)) {
        roles.push(...Array(RoleN).fill(role));
    }
    console.log(Object.entries(roleCounts));
    

    if (roles.length > players.length) {
        alert("Total roles exceed the number of players.");
        return;
    }
    while (roles.length < players.length) {
        roles.push("Villager");
    }

    const y5aletlesRoles = roles.sort(() => Math.random() - 0.5);
    s = players.map((player, index) => ({
        name: player,
        role: y5aletlesRoles[index]
    }));

    resetGameState();
    displayNextRole();
}
function totalRolesCount() {
    const roleInputs = document.querySelectorAll('.custom-number-input input[type="number"]');
    let totalRoles = 0;
    roleInputs.forEach(input => {
        totalRoles += parseInt(input.value) || 0;
    });
    return totalRoles;
}
function resetGameState() {
    n = 0;
    num_click = 0;
    finalResults = [];
    document.getElementById("card").classList.remove("hidden");
}

function displayNextRole() {
    document.getElementById("result").classList.add("hidden");
    document.getElementById("RoleSelection").classList.add("hidden");
    const roleDisplay = document.getElementById("roleDisplay");

    if (n >= s.length) {
        document.getElementById("resultBUtton").classList.remove("hidden");
        document.getElementById("card").classList.add("hidden");
        return;
    }

    const player = s[n];

    if (num_click % 2 === 0) {
        roleDisplay.innerHTML = `Player: <span class="highlight">${player.name}</span>`;
    } else {
        roleDisplay.innerHTML = `Role: <span class="highlight">${player.role}</span>`;
        finalResults.push(`Player: ${player.name}, Role: ${player.role}`);
        n++;
    }
    num_click++;
}
function afficherTousLesJoueurs() {
    if (n >= s.length) {
        const resultDiv = document.getElementById("result");
        resultDiv.innerHTML = "";

        finalResults.forEach(result => {
            const line = document.createElement("div");
            line.classList.add("linediv")
            
            if (result.includes("Role: Werewolf")) {
                line.innerHTML = result.replace(
                    "Role: Werewolf",
                    '<span style="color: red;">Role: Werewolf</span>'
                );
            }
            else if(result.includes("Role: Infected Wolf")){
                line.innerHTML = result.replace(
                    "Role: Infected Wolf",
                    '<span style="color: red;">Role: Infected Wolf</span>'
                );
            }
            else if(result.includes("Role: Talkative wolf")){
                line.innerHTML = result.replace(
                    "Role: Talkative wolf",
                    '<span style="color: red;">Role: Talkative wolf</span>'
                );
            }
            else if(result.includes("Role: White wolf")){
                line.innerHTML = result.replace(
                    "Role: White wolf",
                    '<span style="color: red;">Role: White wolf</span>'
                );
            }
            else if(result.includes("Role: Blue wolf")){
                line.innerHTML = result.replace(
                    "Role: Blue wolf",
                    '<span style="color: red;">Role: Blue wolf</span>'
                );
            }
            else if(result.includes("Role: Red wolf")){
                line.innerHTML = result.replace(
                    "Role: Red wolf",
                    '<span style="color: red;">Role: Red wolf</span>'
                );
            }
            else if(result.includes("Role: Fog wolf")){
                line.innerHTML = result.replace(
                    "Role: Fog wolf",
                    '<span style="color: red;">Role: Fog wolf</span>'
                );
            }
            else if(result.includes("Role: Alien wolf")){
                line.innerHTML = result.replace(
                    "Role: Alien wolf",
                    '<span style="color: green;">Role: Alien wolf</span>'
                );
            }
             else {
                line.textContent = result;
            }
            
            resultDiv.appendChild(line);
        });
    }
}

function playerRemoveButton() {
    document.getElementById("RoleSelection").classList.add("hidden")
    document.getElementById("result").classList.add("hidden")
    const playerRemoveDiv = document.getElementById("playerRemoveDiv");
    playerRemoveDiv.classList.toggle("hidden");

    if (!playerRemoveDiv.classList.contains("hidden")) {
        updatePlayerList();
    }
}

function resultBUtton() {
    document.getElementById("playerRemoveDiv").classList.add("hidden")
    document.getElementById("RoleSelection").classList.add("hidden")
    const resultDiv = document.getElementById("result");
    resultDiv.classList.toggle("hidden");
    if (!resultDiv.classList.contains("hidden")) {
        afficherTousLesJoueurs();
    }
}

function parametre() {
    document.getElementById("playerRemoveDiv").classList.add("hidden")
    document.getElementById("result").classList.add("hidden")
    if (players.length < 6) {
        alert("Minimum 6 players required.");
        return;
    }
    if (players.length >= 6) {
        const RoleSelection = document.getElementById("RoleSelection");
        RoleSelection.classList.toggle("hidden");
    }
}

function resetGame() {
    players = [];
    s = [];
    n = 0;
    finalResults = [];
    num_click = 0;

    document.getElementById("inputName").value = '';
    document.getElementById("playerList").innerHTML = '<strong>Players (0):</strong>';
    document.getElementById("playerRemoveDiv").innerHTML = '';
    document.getElementById("RoleSelection").classList.add("hidden");
    document.getElementById("card").classList.add("hidden");
    document.getElementById("result").classList.add("hidden");
    document.getElementById("resultBUtton").classList.add("hidden");
}

function closeCard(){
    finalResults = []
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = ""
    document.getElementById("resultBUtton").classList.remove("hidden");
    document.getElementById("card").classList.add("hidden");
}

function closeparametre(){
    document.getElementById("RoleSelection").classList.add("hidden")
}

document.addEventListener("DOMContentLoaded", () => {
    const card = document.getElementById("card");
    if (card) {
        card.addEventListener("click", displayNextRole);
    } else {
        console.error("Card element not found!");
    }

    // css of inpute number
    document.querySelectorAll('.custom-number-input').forEach(inputContainer => {
        const input = inputContainer.querySelector('input[type="number"]');
        const leftArrow = inputContainer.querySelector('.left-arrow');
        const rightArrow = inputContainer.querySelector('.right-arrow');

        // left arrow click
        leftArrow.addEventListener('click', () => {
            if (input.value > input.min) {
                input.value = parseInt(input.value) - 1;
                const rolenumber = document.getElementById("rolenumber")
                rolenumber.innerHTML = `roles: ${totalRolesCount()}`
            }
        });

        // right arrow click
        rightArrow.addEventListener('click', () => {
            if (input.value < input.max) {
                input.value = parseInt(input.value) + 1;
                const rolenumber = document.getElementById("rolenumber")
                rolenumber.innerHTML = `roles: ${totalRolesCount()}`
            }
        });
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
        Addplayer();
    }
});